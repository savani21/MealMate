import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Search, ChefHat, Clock, Heart, Utensils, Sparkles, X } from "lucide-react";

export default function Recipes() {
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const returnToPlanner = params.get("return") === "meal-planner";
  const returnToMealPlan = params.get("return") === "meal-plan";
  const planId = params.get("planId") || "";
  const mealName = params.get("meal") || "";
  const initialIngredients = params.get("ingredients") || "";
  const available = params.get("available") || "";
  const recommended = params.get("recommended") || "";
  const mode = params.get("mode") || "available";

  const [recipes, setRecipes] = useState([]);
  const [search, setSearch] = useState(initialIngredients);
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [showGenerator, setShowGenerator] = useState(params.get("generate") === "1");
  const [ingredients, setIngredients] = useState(initialIngredients);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchRecipes();
    fetchFavorites();
  }, []);

  const fetchRecipes = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/recipes");
      const data = await response.json();
      if (!response.ok) { alert(data.message || "Failed to load recipes"); return; }
      setRecipes(data.recipes || []);
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server.");
    } finally { setLoading(false); }
  };

  const fetchFavorites = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const response = await fetch("http://localhost:5000/api/favorites", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        const favoriteRecipes = data.favorites || data.recipes || [];
        setFavorites(favoriteRecipes.map((item) => item._id || item));
      }
    } catch (error) {
      console.error("Load favorites error:", error);
    }
  };

  const backDestination = () => {
    if (returnToMealPlan && planId) return `/meal-plans/${planId}`;
    if (returnToPlanner) {
      const query = new URLSearchParams({ ingredients: available || initialIngredients, recommended, mode });
      return `/meal-planner?${query.toString()}`;
    }
    return "/dashboard";
  };

  const backLabel = returnToMealPlan ? "Back to Meal Plan" : returnToPlanner ? "Back to Meal Planner" : "Back to Dashboard";

  const generateRecipe = async () => {
    if (!ingredients.trim()) { alert("Enter at least one ingredient."); return; }
    setGenerating(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/ai/generate-recipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ingredients, mealName }),
      });
      const data = await response.json();
      if (!response.ok) { alert(data.message || "Failed to generate recipe"); return; }

      setShowGenerator(false);
      setRecipes((prev) => [data.recipe, ...prev]);
      const query = new URLSearchParams({
        return: returnToMealPlan ? "meal-plan" : returnToPlanner ? "meal-planner" : "recipes",
        planId,
        meal: mealName,
        available,
        recommended,
        mode,
      });
      setLocation(`/recipes/${data.recipe._id}?${query.toString()}`);
    } catch (error) {
      console.error(error);
      alert("Unable to generate recipe.");
    } finally { setGenerating(false); }
  };

  const searchTerms = search.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
  const filteredRecipes = recipes.filter((recipe) => {
    const searchableText = [recipe.name, recipe.description, ...(recipe.ingredients || [])].join(" ").toLowerCase();
    const matchesSearch = searchTerms.length === 0 || searchTerms.some((term) => searchableText.includes(term));
    return matchesSearch && (category === "All" || recipe.category === category);
  });
  const categories = ["All", ...new Set(recipes.map((recipe) => recipe.category).filter(Boolean))];

  const toggleFavorite = async (recipeId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) { alert("Please log in to manage favorites."); return; }
      const isFavorite = favorites.includes(recipeId);
      const response = await fetch(`http://localhost:5000/api/favorites/${recipeId}`, {
        method: isFavorite ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) { alert(data.message || "Failed to update favorite"); return; }
      setFavorites((prev) => isFavorite ? prev.filter((id) => id !== recipeId) : [...prev, recipeId]);
    } catch (error) {
      console.error(error);
      alert("Unable to update favorite");
    }
  };

  return (
    <div className="min-h-screen bg-[#f7faf7]">
      <header className="bg-white border-b border-gray-100">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button onClick={() => setLocation(backDestination())} className="flex items-center gap-2 text-gray-600 hover:text-primary transition">
            <ArrowLeft className="w-5 h-5" />
            {backLabel}
          </button>
          <div className="flex items-center gap-2"><ChefHat className="w-6 h-6 text-primary" /><span className="text-xl font-black text-gray-900">Meal<span className="text-primary">Mate</span></span></div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-primary text-sm font-semibold"><Utensils className="w-4 h-4" /> MealMate Recipes</div>
            <h1 className="text-3xl font-black text-gray-900 mt-2">Recipes</h1>
            <p className="text-gray-500 mt-1">Browse recipes or create one with AI.</p>
          </div>
          <button onClick={() => setShowGenerator(true)} className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-white font-semibold hover:opacity-90 transition">
            <Sparkles className="w-5 h-5" /> Generate Recipe
          </button>
        </div>

        {showGenerator && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 px-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowGenerator(false); }}>
            <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-100 shadow-xl p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary shrink-0" />
                    <h2 className="text-base font-bold text-gray-900">Generate Recipe</h2>
                  </div>
                  {mealName && <p className="text-xs text-primary font-semibold mt-1 truncate">{mealName}</p>}
                </div>
                <button onClick={() => setShowGenerator(false)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-50" title="Close">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <label className="text-xs font-semibold text-gray-600">Ingredients</label>
              <textarea
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                placeholder="Paneer, tomato, onion..."
                rows={2}
                autoFocus
                className="mt-1.5 w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none"
              />

              <div className="flex justify-end gap-2 mt-3">
                <button onClick={() => setShowGenerator(false)} className="px-3.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 font-semibold hover:bg-gray-50">Cancel</button>
                <button onClick={generateRecipe} disabled={generating} className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                  {generating ? "Generating..." : "Generate"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Search recipes or ingredients..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white outline-none focus:border-primary" />
          </div>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-4 py-3 rounded-xl border border-gray-200 bg-white outline-none focus:border-primary">
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>

        {searchTerms.length > 0 && <div className="mb-5 flex flex-wrap items-center gap-2"><span className="text-sm font-semibold text-gray-600">Ingredients:</span>{searchTerms.map((term) => <span key={term} className="px-3 py-1 rounded-full bg-green-50 text-primary text-xs font-semibold">{term}</span>)}</div>}

        {loading ? <div className="text-center py-16 text-gray-500">Loading recipes...</div> : filteredRecipes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center"><ChefHat className="w-10 h-10 mx-auto text-gray-300" /><h2 className="text-lg font-bold text-gray-900 mt-3">No recipes found</h2><p className="text-gray-500 mt-1">Try another search or generate a recipe with AI.</p></div>
        ) : (
          <div className="space-y-2">
            {filteredRecipes.map((recipe) => (
              <button key={recipe._id} onClick={() => setLocation(`/recipes/${recipe._id}`)} className="w-full text-left bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-4 hover:border-primary/40 hover:shadow-md transition">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 shrink-0 rounded-lg bg-green-50 flex items-center justify-center overflow-hidden">
                    {recipe.image ? <img src={recipe.image} alt="" className="w-full h-full object-cover" /> : <ChefHat className="w-5 h-5 text-primary" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <h2 className="font-bold text-gray-900 truncate">{recipe.name}</h2>
                      <div className="flex items-center gap-3 text-xs text-gray-500 shrink-0">
                        <span className="capitalize">{recipe.category || "Recipe"}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{recipe.prepTime || "Easy"}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 truncate mt-1">{recipe.description || "View recipe details and ingredients"}</p>
                  </div>
                  <span onClick={(e) => { e.stopPropagation(); toggleFavorite(recipe._id); }} className="p-2 shrink-0 cursor-pointer" title={favorites.includes(recipe._id) ? "Remove from favorites" : "Add to favorites"}>
                    <Heart className={`w-5 h-5 ${favorites.includes(recipe._id) ? "fill-red-500 text-red-500" : "text-gray-300 hover:text-red-400"}`} />
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
