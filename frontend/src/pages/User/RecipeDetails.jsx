import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import {
  ChefHat,
  Clock,
  Utensils,
  Share2,
  Download,
  FileText,
  Trash2,
} from "lucide-react";

export default function RecipeDetails() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/recipes/:id");
  const query = new URLSearchParams(window.location.search);
  const returnToPlanner = query.get("return") === "meal-planner";
  const returnToMealPlan = query.get("return") === "meal-plan";
  const planId = query.get("planId") || "";
  const available = query.get("available") || "";
  const recommended = query.get("recommended") || "";
  const mode = query.get("mode") || "available";

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (params?.id) fetchRecipe();
  }, [params?.id]);

  const fetchRecipe = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/recipes/${params.id}`);
      const data = await response.json();
      if (!response.ok) {
        alert(data.message || "Recipe not found");
        navigateToSource();
        return;
      }
      setRecipe(data.recipe);
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const navigateToSource = () => {
    if (returnToMealPlan && planId) return setLocation(`/meal-plans/${planId}`);
    if (!returnToPlanner) return setLocation("/recipes");
    const params = new URLSearchParams({ ingredients: available, recommended, mode });
    setLocation(`/meal-planner?${params.toString()}`);
  };

  const shareRecipe = async () => {
    const shareData = {
      title: recipe.name,
      text: `${recipe.name}\n${recipe.description || "MealMate recipe"}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        alert("Recipe link copied to clipboard.");
      } else {
        window.prompt("Copy this recipe link:", window.location.href);
      }
    } catch (error) {
      if (error?.name !== "AbortError") console.error("Share recipe error:", error);
    }
  };

  const downloadImage = async () => {
    try {
      if (recipe.image) {
        const response = await fetch(recipe.image);
        if (!response.ok) throw new Error("Unable to download image");
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${recipe.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.jpg`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        return;
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas is not supported");

      const width = 1200;
      const padding = 70;
      const contentWidth = width - padding * 2;
      const lineHeight = 34;
      const wrapText = (text, font) => {
        ctx.font = font;
        const words = String(text || "").split(/\s+/);
        const lines = [];
        let line = "";
        words.forEach((word) => {
          const test = line ? `${line} ${word}` : word;
          if (ctx.measureText(test).width > contentWidth && line) {
            lines.push(line);
            line = word;
          } else {
            line = test;
          }
        });
        if (line) lines.push(line);
        return lines;
      };

      const sections = [];
      let height = 150;

      const titleLines = wrapText(recipe.name, "bold 42px Arial");
      sections.push({ type: "title", lines: titleLines });
      height += titleLines.length * 50 + 25;

      const descriptionLines = wrapText(recipe.description || "MealMate recipe", "22px Arial");
      sections.push({ type: "description", lines: descriptionLines });
      height += descriptionLines.length * 32 + 35;

      sections.push({ type: "heading", text: "Ingredients" });
      height += 55;
      (recipe.ingredients || []).forEach((item) => {
        const lines = wrapText(`• ${item}`, "20px Arial");
        sections.push({ type: "body", lines });
        height += lines.length * lineHeight + 10;
      });

      sections.push({ type: "heading", text: "Instructions" });
      height += 55;
      (recipe.instructions || []).forEach((item, index) => {
        const lines = wrapText(`${index + 1}. ${item}`, "20px Arial");
        sections.push({ type: "body", lines });
        height += lines.length * lineHeight + 10;
      });

      canvas.width = width;
      canvas.height = Math.max(height + 70, 700);

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, canvas.height);
      ctx.fillStyle = "#16a34a";
      ctx.fillRect(0, 0, width, 12);

      let y = 70;
      sections.forEach((section) => {
        if (section.type === "title") {
          ctx.fillStyle = "#111827";
          ctx.font = "bold 42px Arial";
          section.lines.forEach((line) => { ctx.fillText(line, padding, y); y += 50; });
          y += 15;
        } else if (section.type === "description") {
          ctx.fillStyle = "#6b7280";
          ctx.font = "22px Arial";
          section.lines.forEach((line) => { ctx.fillText(line, padding, y); y += 32; });
          y += 20;
        } else if (section.type === "heading") {
          ctx.fillStyle = "#16a34a";
          ctx.font = "bold 28px Arial";
          ctx.fillText(section.text, padding, y);
          y += 42;
        } else {
          ctx.fillStyle = "#374151";
          ctx.font = "20px Arial";
          section.lines.forEach((line) => { ctx.fillText(line, padding, y); y += lineHeight; });
          y += 10;
        }
      });

      ctx.fillStyle = "#9ca3af";
      ctx.font = "16px Arial";
      ctx.fillText("MealMate", padding, canvas.height - 28);

      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${recipe.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Image download error:", error);
      alert("Unable to create the recipe image. Please try again.");
    }
  };

  const downloadPdf = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF();
      const margin = 18;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const contentWidth = pageWidth - margin * 2;
      let y = 20;

      const addWrappedText = (text, fontSize, gap = 7) => {
        pdf.setFontSize(fontSize);
        const lines = pdf.splitTextToSize(String(text || ""), contentWidth);
        if (y + lines.length * gap > 280) { pdf.addPage(); y = 20; }
        pdf.text(lines, margin, y);
        y += lines.length * gap + 4;
      };

      pdf.setFont("helvetica", "bold");
      addWrappedText(recipe.name, 20, 8);
      pdf.setFont("helvetica", "normal");
      addWrappedText(recipe.description || "MealMate recipe", 11, 6);
      addWrappedText(`Category: ${recipe.category || "Other"}   Diet: ${recipe.diet || "Any"}   Prep: ${recipe.prepTime || "Not specified"}`, 10, 6);
      pdf.setFont("helvetica", "bold");
      addWrappedText("Ingredients", 14, 7);
      pdf.setFont("helvetica", "normal");
      (recipe.ingredients || []).forEach((item) => addWrappedText(`• ${item}`, 10, 5));
      pdf.setFont("helvetica", "bold");
      addWrappedText("Instructions", 14, 7);
      pdf.setFont("helvetica", "normal");
      (recipe.instructions || []).forEach((item, index) => addWrappedText(`${index + 1}. ${item}`, 10, 5));
      pdf.save(`${recipe.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`);
    } catch (error) {
      console.error("PDF download error:", error);
      alert("PDF download is unavailable. Run npm install in the frontend folder after pulling the latest changes.");
    }
  };

  const deleteRecipe = async () => {
    const confirmed = window.confirm(`Delete this recipe?\n\n${recipe.name}\n\nThis action cannot be undone.`);
    if (!confirmed) return;
    const token = localStorage.getItem("token");
    try {
      setDeleting(true);
      const response = await fetch(`http://localhost:5000/api/recipes/${encodeURIComponent(recipe._id)}`, {
        method: "DELETE",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), Accept: "application/json" },
      });
      const text = await response.text();
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
      if (!response.ok) { alert(data.message || `Unable to delete recipe (${response.status}).`); return; }
      setLocation(returnToMealPlan && planId ? `/meal-plans/${planId}` : returnToPlanner ? "/meal-planner" : "/recipes");
    } catch (error) {
      console.error("Delete recipe error:", error);
      alert("Unable to connect to the server.");
    } finally { setDeleting(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#f7faf7]"><p className="text-gray-500">Loading recipe...</p></div>;
  if (!recipe) return null;

  return (
    <div className="min-h-screen bg-[#f7faf7]">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="h-20 flex items-center justify-between gap-6">
            <div className="flex items-center gap-2 shrink-0"><ChefHat className="w-6 h-6 text-primary" /><span className="text-xl font-black text-gray-900">Meal<span className="text-primary">Mate</span></span></div>
            <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto text-sm font-semibold">
              <NavLink label="Dashboard" onClick={() => setLocation("/dashboard")} />
              <NavLink label="Meal Plans" active={returnToMealPlan} onClick={() => setLocation("/my-meal-plans")} />
              <NavLink label="Recipes" active={!returnToMealPlan} onClick={() => setLocation("/recipes")} />
              <NavLink label="Favorites" onClick={() => setLocation("/favorites")} />
              <NavLink label="Notifications" onClick={() => setLocation("/notifications")} />
              <NavLink label="Profile" onClick={() => setLocation("/profile")} />
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-5 flex items-center gap-2 text-sm text-gray-500">
          <button onClick={() => setLocation(returnToMealPlan && planId ? `/meal-plans/${planId}` : returnToPlanner ? "/meal-planner" : "/recipes")} className="hover:text-primary transition">{returnToMealPlan ? "Meal Plans" : returnToPlanner ? "Meal Planner" : "Recipes"}</button>
          <span>/</span><span className="text-gray-900 font-semibold truncate">{recipe.name}</span>
        </div>
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6">
          <div className="flex flex-col md:flex-row gap-5 md:items-center">
            {recipe.image ? <img src={recipe.image} alt={recipe.name} className="w-full md:w-36 h-32 object-cover rounded-xl shrink-0" /> : <div className="w-full md:w-36 h-32 rounded-xl bg-green-50 flex items-center justify-center shrink-0"><ChefHat className="w-12 h-12 text-primary" /></div>}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-2 mb-2"><span className="px-2.5 py-1 rounded-full bg-green-50 text-primary text-xs font-semibold">{recipe.category || "Other"}</span><span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">{recipe.diet || "Any"}</span></div>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">{recipe.name}</h1>
              <p className="text-sm text-gray-500 mt-2 line-clamp-2">{recipe.description || "A delicious MealMate recipe."}</p>
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-3"><Clock className="w-4 h-4 text-primary" /><span>{recipe.prepTime || "Preparation time not specified"}</span></div>
            </div>
          </div>
          <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
            <button onClick={shareRecipe} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 font-semibold text-sm hover:border-primary hover:text-primary transition"><Share2 className="w-4 h-4" /> Share</button>
            <button onClick={downloadImage} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 font-semibold text-sm hover:border-primary hover:text-primary transition"><Download className="w-4 h-4" /> Image</button>
            <button onClick={downloadPdf} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 font-semibold text-sm hover:border-primary hover:text-primary transition"><FileText className="w-4 h-4" /> PDF</button>
            <button onClick={deleteRecipe} disabled={deleting} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-100 bg-red-50 text-red-600 font-semibold text-sm hover:bg-red-100 disabled:opacity-50 transition"><Trash2 className="w-4 h-4" /> {deleting ? "Deleting..." : "Delete"}</button>
          </div>
        </section>

        <section className="mt-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6">
          <div className="flex items-center gap-3 mb-5"><div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center"><Utensils className="w-4 h-4 text-primary" /></div><h2 className="text-xl font-black text-gray-900">Ingredients</h2></div>
          {recipe.ingredients?.length > 0 ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">{recipe.ingredients.map((ingredient, index) => <div key={index} className="flex items-center gap-3 rounded-lg bg-gray-50 px-3.5 py-2.5 text-sm text-gray-700"><span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />{ingredient}</div>)}</div> : <p className="text-gray-500">No ingredients available.</p>}
        </section>

        <section className="mt-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6">
          <h2 className="text-xl font-black text-gray-900 mb-5">Instructions</h2>
          {recipe.instructions?.length > 0 ? <div className="space-y-3">{recipe.instructions.map((instruction, index) => <div key={index} className="flex gap-3 rounded-lg bg-gray-50 p-3.5"><div className="w-7 h-7 shrink-0 rounded-full bg-green-50 text-primary flex items-center justify-center text-sm font-bold">{index + 1}</div><p className="text-sm text-gray-700 leading-relaxed pt-0.5">{instruction}</p></div>)}</div> : <p className="text-gray-500">No instructions available.</p>}
        </section>
      </main>
    </div>
  );
}

function NavLink({ label, active, onClick }) { return <button onClick={onClick} className={`px-3 py-2 rounded-lg whitespace-nowrap transition ${active ? "bg-green-50 text-primary" : "text-gray-600 hover:bg-gray-50 hover:text-primary"}`}>{label}</button>; }
