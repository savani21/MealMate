import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import {
  ArrowLeft,
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
        goBackToSource();
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

  const goBackToSource = () => {
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
      if (navigator.share) await navigator.share(shareData);
      else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        alert("Recipe link copied to clipboard.");
      } else window.prompt("Copy this recipe link:", window.location.href);
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
      addWrappedText(
        `Category: ${recipe.category || "Other"}   Diet: ${recipe.diet || "Any"}   Prep: ${recipe.prepTime || "Not specified"}`,
        10,
        6
      );
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
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { message: text };
      }
      if (!response.ok) {
        alert(data.message || `Unable to delete recipe (${response.status}).`);
        return;
      }
      setLocation(returnToMealPlan && planId ? `/meal-plans/${planId}` : returnToPlanner ? "/meal-planner" : "/recipes");
    } catch (error) {
      console.error("Delete recipe error:", error);
      alert("Unable to connect to the server.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#f7faf7]"><p className="text-gray-500">Loading recipe...</p></div>;
  }

  if (!recipe) return null;

  return (
    <div className="min-h-screen bg-[#f7faf7]">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="h-14 flex items-center justify-between">
            <button onClick={goBackToSource} className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition">
              <ArrowLeft className="w-4 h-4" />
              {returnToMealPlan ? "Back to Meal Plan" : returnToPlanner ? "Back to Meal Planner" : "Back to Recipes"}
            </button>
            <div className="flex items-center gap-1.5">
              <ChefHat className="w-5 h-5 text-primary" />
              <span className="font-black text-gray-900">Meal<span className="text-primary">Mate</span></span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-5">
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 flex gap-4 items-start">
            {recipe.image ? (
              <img src={recipe.image} alt={recipe.name} className="w-24 h-20 object-cover rounded-lg shrink-0" />
            ) : (
              <div className="w-24 h-20 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                <ChefHat className="w-8 h-8 text-primary" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                <span className="px-2 py-0.5 rounded-full bg-green-50 text-primary text-[11px] font-semibold">{recipe.category || "Other"}</span>
                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[11px] font-semibold">{recipe.diet || "Any"}</span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-gray-900 leading-tight">{recipe.name}</h1>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{recipe.description || "A delicious MealMate recipe."}</p>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2">
                <Clock className="w-3.5 h-3.5 text-primary" />
                {recipe.prepTime || "Preparation time not specified"}
              </div>
            </div>
          </div>

          <div className="px-4 pb-4 flex flex-wrap gap-1.5">
            <button onClick={shareRecipe} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 font-semibold text-xs hover:border-primary hover:text-primary transition"><Share2 className="w-3.5 h-3.5" />Share</button>
            <button onClick={downloadImage} disabled={!recipe.image} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 font-semibold text-xs hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition"><Download className="w-3.5 h-3.5" />Image</button>
            <button onClick={downloadPdf} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 font-semibold text-xs hover:border-primary hover:text-primary transition"><FileText className="w-3.5 h-3.5" />PDF</button>
            <button onClick={deleteRecipe} disabled={deleting} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-100 bg-red-50 text-red-600 font-semibold text-xs hover:bg-red-100 disabled:opacity-50 transition"><Trash2 className="w-3.5 h-3.5" />{deleting ? "Deleting..." : "Delete"}</button>
          </div>

          <div className="border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Utensils className="w-4 h-4 text-primary" />
                <h2 className="font-black text-gray-900">Ingredients</h2>
              </div>
              {recipe.ingredients?.length > 0 ? (
                <div className="space-y-1.5">
                  {recipe.ingredients.map((ingredient, index) => (
                    <div key={index} className="flex items-center gap-2 rounded-md bg-gray-50 px-2.5 py-2 text-xs text-gray-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />{ingredient}
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-gray-500">No ingredients available.</p>}
            </div>

            <div className="p-4">
              <h2 className="font-black text-gray-900 mb-3">Instructions</h2>
              {recipe.instructions?.length > 0 ? (
                <div className="space-y-2">
                  {recipe.instructions.map((instruction, index) => (
                    <div key={index} className="flex gap-2.5">
                      <div className="w-6 h-6 shrink-0 rounded-full bg-green-50 text-primary flex items-center justify-center text-[11px] font-bold">{index + 1}</div>
                      <p className="text-xs text-gray-700 leading-relaxed pt-0.5">{instruction}</p>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-gray-500">No instructions available.</p>}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
