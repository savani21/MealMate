import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { ArrowLeft, ChefHat, Clock, Utensils, Share2, Download, FileText, Trash2 } from "lucide-react";

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

  useEffect(() => { if (params?.id) fetchRecipe(); }, [params?.id]);

  const fetchRecipe = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/recipes/${params.id}`);
      const data = await response.json();
      if (!response.ok) {
        alert(data.message || "Recipe not found");
        setLocation(returnToMealPlan && planId ? `/meal-plans/${planId}` : returnToPlanner ? "/meal-planner" : "/recipes");
        return;
      }
      setRecipe(data.recipe);
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server.");
    } finally { setLoading(false); }
  };

  const goBack = () => {
    if (returnToMealPlan && planId) return setLocation(`/meal-plans/${planId}`);
    if (!returnToPlanner) return setLocation("/recipes");
    const query = new URLSearchParams({ ingredients: available, recommended, mode });
    setLocation(`/meal-planner?${query.toString()}`);
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
    if (!recipe.image) {
      alert("No recipe image is available to download.");
      return;
    }

    try {
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
    } catch (error) {
      console.error("Image download error:", error);
      window.open(recipe.image, "_blank", "noopener,noreferrer");
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
        if (y + lines.length * gap > 280) {
          pdf.addPage();
          y = 20;
        }
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
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          Accept: "application/json",
        },
      });
      const text = await response.text();
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
      if (!response.ok) {
        alert(data.message || `Unable to delete recipe (${response.status}).`);
        return;
      }
      alert("Recipe deleted successfully.");
      setLocation(returnToMealPlan && planId ? `/meal-plans/${planId}` : returnToPlanner ? "/meal-planner" : "/recipes");
    } catch (error) {
      console.error("Delete recipe error:", error);
      alert("Unable to connect to the server.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#f7faf7]"><p className="text-gray-500">Loading recipe...</p></div>;
  if (!recipe) return null;

  return (
    <div className="min-h-screen bg-[#f7faf7]">
      <header className="bg-white border-b border-gray-100">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="h-20 flex items-center justify-between">
            <button onClick={goBack} className="flex items-center gap-2 text-gray-600 hover:text-primary transition">
              <ArrowLeft className="w-5 h-5" />
              {returnToMealPlan ? "Back to Meal Plan" : returnToPlanner ? "Back to Meal Planner" : "Back to Recipes"}
            </button>
            <div className="flex items-center gap-2"><ChefHat className="w-6 h-6 text-primary" /><span className="text-xl font-black text-gray-900">Meal<span className="text-primary">Mate</span></span></div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-64 md:h-80 bg-green-50 flex items-center justify-center">
            {recipe.image ? <img src={recipe.image} alt={recipe.name} className="w-full h-full object-cover" /> : <ChefHat className="w-24 h-24 text-primary" />}
          </div>
          <div className="p-6 md:p-10">
            <div className="flex flex-wrap gap-3">
              <span className="px-3 py-1 rounded-full bg-green-50 text-primary text-sm font-semibold">{recipe.category || "Other"}</span>
              <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm font-semibold">{recipe.diet || "Any"}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 mt-5">{recipe.name}</h1>
            <p className="text-gray-500 mt-4 max-w-3xl">{recipe.description || "A delicious MealMate recipe."}</p>
            <div className="flex items-center gap-2 text-gray-500 mt-5"><Clock className="w-5 h-5 text-primary" /><span>{recipe.prepTime || "Preparation time not specified"}</span></div>

            <div className="flex flex-wrap gap-2 mt-6 pt-5 border-t border-gray-100">
              <button onClick={shareRecipe} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold text-sm hover:border-primary hover:text-primary transition"><Share2 className="w-4 h-4" /> Share</button>
              <button onClick={downloadImage} disabled={!recipe.image} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold text-sm hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition"><Download className="w-4 h-4" /> Image</button>
              <button onClick={downloadPdf} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold text-sm hover:border-primary hover:text-primary transition"><FileText className="w-4 h-4" /> PDF</button>
              <button onClick={deleteRecipe} disabled={deleting} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-100 bg-red-50 text-red-600 font-semibold text-sm hover:bg-red-100 disabled:opacity-50 transition"><Trash2 className="w-4 h-4" /> {deleting ? "Deleting..." : "Delete"}</button>
            </div>
          </div>
        </section>

        <section className="mt-8 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6"><div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center"><Utensils className="w-5 h-5 text-primary" /></div><h2 className="text-2xl font-black text-gray-900">Ingredients</h2></div>
          {recipe.ingredients?.length > 0 ? <ul className="space-y-3">{recipe.ingredients.map((ingredient, index) => <li key={index} className="flex items-center gap-3 text-gray-700"><span className="w-2 h-2 rounded-full bg-primary" />{ingredient}</li>)}</ul> : <p className="text-gray-500">No ingredients available.</p>}
        </section>

        <section className="mt-8 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">
          <h2 className="text-2xl font-black text-gray-900 mb-6">Instructions</h2>
          {recipe.instructions?.length > 0 ? <div className="space-y-5">{recipe.instructions.map((instruction, index) => <div key={index} className="flex gap-4"><div className="w-9 h-9 shrink-0 rounded-full bg-green-50 text-primary flex items-center justify-center font-bold">{index + 1}</div><p className="text-gray-700 leading-relaxed pt-1">{instruction}</p></div>)}</div> : <p className="text-gray-500">No instructions available.</p>}
        </section>
      </main>
    </div>
  );
}
