import AppNavbar from "@/components/AppNavbar";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  Search, ChefHat, Clock, Heart, Utensils, Sparkles, X, Star,
  SlidersHorizontal, TrendingUp, Flame, ArrowUpDown, Leaf,
} from "lucide-react";

const DIET_OPTIONS = ["All diets", "Vegetarian", "Vegan", "Non-vegetarian", "Eggetarian"];
const SORT_OPTIONS = [
  { value: "popular", label: "Most popular" },
  { value: "rating", label: "Top rated" },
  { value: "newest", label: "Newest first" },
  { value: "name", label: "Name A–Z" },
];

function getMinutes(value) {
  const match = String(value || "").match(/\d+/);
  return match ? Number(match[0]) : null;
}

const VEGETARIAN_IMAGES = [
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1515003197210-e0cd7184f8b5?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=85",
];

const NON_VEGETARIAN_IMAGES = [
  "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=85",
];

function getRecipeImageCandidates(recipe) {
  const diet = String(recipe.diet || "").trim().toLowerCase();
  const ingredients = (Array.isArray(recipe.ingredients) ? recipe.ingredients : [])
    .map((item) => typeof item === "string" ? item : item?.name || item?.ingredient || "")
    .join(" ");
  const recipeText = `${recipe.name || ""} ${recipe.description || ""} ${ingredients}`.toLowerCase();
  const animalTerms = /\b(chicken|turkey|duck|mutton|lamb|beef|pork|fish|salmon|tuna|prawn|shrimp|seafood|crab|lobster|bacon|ham|sausage|meat)\b/i;
  const isNonVegetarian = diet.includes("non-vegetarian") || animalTerms.test(recipeText);
  return isNonVegetarian ? NON_VEGETARIAN_IMAGES : VEGETARIAN_IMAGES;
}

function getRecipeImage(recipe, index) {
  const images = getRecipeImageCandidates(recipe);
  const stableKey = String(recipe._id || recipe.name || index);
  const hash = stableKey.split("").reduce((value, char) => (value * 31 + char.charCodeAt(0)) >>> 0, 7);
  return images[hash % images.length];
}

export default function Recipes() {
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const returnToPlanner = params.get("return") === "meal-planner";
  const returnToMealPlan = params.get("return") === "meal-plan";
  const planId = params.get("planId") || "";
  const mealName = params.get("meal") || "";
  const mealDay = params.get("day") || "";
  const mealType = (params.get("mealType") || "").trim().toLowerCase();
  const validMealTypes = ["breakfast", "lunch", "dinner"];
  const initialIngredients = [...new Map(
    (params.get("ingredients") || "")
      .split(",")
      .map((item) => item.replace(/^\s*as\s+needed\s*[:,-]?\s*/i, "").trim())
      .filter(Boolean)
      .map((item) => [item.toLowerCase(), item])
  ).values()].join(", ");
  const available = params.get("available") || "";
  const recommended = params.get("recommended") || "";
  const mode = params.get("mode") || "available";

  const [recipes, setRecipes] = useState([]);
  const [recipeImages, setRecipeImages] = useState({});
  const [search, setSearch] = useState(params.get("search") || initialIngredients);
  const [category, setCategory] = useState("All");
  const [diet, setDiet] = useState("All diets");
  const [timeLimit, setTimeLimit] = useState("Any time");
  const [sortBy, setSortBy] = useState("popular");
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [showGenerator, setShowGenerator] = useState(params.get("generate") === "1");
  const [generating, setGenerating] = useState(false);
  const [generationSlow, setGenerationSlow] = useState(false);

  useEffect(() => { fetchRecipes(); fetchFavorites(); }, []);
  useEffect(() => {
    if (!recipes.length) return;
    const images = Object.fromEntries(
      recipes.map((recipe, index) => [recipe._id, getRecipeImage(recipe, index)])
    );
    setRecipeImages(images);
  }, [recipes]);

  useEffect(() => {
    if (!generating) { setGenerationSlow(false); return; }
    const timer = setTimeout(() => setGenerationSlow(true), 8000);
    return () => clearTimeout(timer);
  }, [generating]);

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
    } catch (error) { console.error("Load favorites error:", error); }
  };

  const generateRecipe = async () => {
    if (!initialIngredients.trim()) {
      alert("No ingredients were passed from the selected meal. Go back and choose a meal again.");
      return;
    }
    setGenerating(true);
    setGenerationSlow(false);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/ai/generate-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ ingredients: initialIngredients, mealName, diet: params.get("diet") || "Any", category: mealType }),
      });
      const data = await response.json();
      if (!response.ok) { alert(data.message || "Failed to generate recipe"); return; }
      let mealLinkWarning = "";
      if (returnToMealPlan && planId && mealDay) {
        try {
          if (!validMealTypes.includes(mealType)) throw new Error("The meal type is missing from this meal-plan link. Return to your meal plan and try again.");
          if (!token) throw new Error("Your login session is missing. Please sign in again.");
          const saveResponse = await fetch(`http://localhost:5000/api/meal-plans/${planId}/selection`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ day: mealDay, mealType, recipeId: data.recipe._id }),
          });
          const saveData = await saveResponse.json();
          if (!saveResponse.ok) throw new Error(saveData.message || `Meal link failed (HTTP ${saveResponse.status}).`);
        } catch (linkError) {
          console.error("Recipe generated, but linking it to the meal failed:", linkError);
          mealLinkWarning = linkError.message;
        }
      }
      setShowGenerator(false);
      setRecipes((prev) => [data.recipe, ...prev]);
      const query = new URLSearchParams({
        return: returnToMealPlan ? "meal-plan" : returnToPlanner ? "meal-planner" : "recipes",
        planId, meal: mealName, day: mealDay, mealType, available, recommended, mode,
      });
      if (mealLinkWarning) alert(`Recipe generated successfully, but it could not be linked to this meal: ${mealLinkWarning}`);
      setLocation(`/recipes/${data.recipe._id}?${query.toString()}`);
    } catch (error) {
      console.error("Recipe generation failed:", error);
      alert(error.message || "Unable to generate recipe. Check the backend server logs for details.");
    } finally { setGenerating(false); }
  };

  const searchTerms = search.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
  const categories = ["All", "Breakfast", "Lunch", "Dinner"];

  const filteredRecipes = useMemo(() => {
    const filtered = recipes.filter((recipe) => {
      const searchableText = [recipe.name, recipe.description, ...(recipe.ingredients || [])].join(" ").toLowerCase();
      const matchesSearch = searchTerms.length === 0 || searchTerms.some((term) => searchableText.includes(term));
      const matchesCategory = category === "All" || String(recipe.category || "").trim().toLowerCase() === category.toLowerCase();
      const matchesDiet = diet === "All diets" || String(recipe.diet || "Any").toLowerCase() === diet.toLowerCase();
      const minutes = getMinutes(recipe.prepTime);
      const matchesTime = timeLimit === "Any time" || (minutes !== null && minutes <= Number(timeLimit));
      return matchesSearch && matchesCategory && matchesDiet && matchesTime;
    });

    return filtered.sort((a, b) => {
      if (sortBy === "rating") return (b.averageRating || 0) - (a.averageRating || 0) || (b.ratingCount || 0) - (a.ratingCount || 0);
      if (sortBy === "newest") return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      if (sortBy === "name") return String(a.name || "").localeCompare(String(b.name || ""));
      return (b.likesCount || 0) - (a.likesCount || 0) || (b.averageRating || 0) - (a.averageRating || 0);
    });
  }, [recipes, searchTerms.join("|"), category, diet, timeLimit, sortBy]);

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

  const clearFilters = () => {
    setSearch("");
    setCategory("All");
    setDiet("All diets");
    setTimeLimit("Any time");
  };

  return (
    <div className="min-h-screen bg-[#f7faf7]">
      <AppNavbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {returnToMealPlan && planId && (
          <div className="mb-5 flex items-center gap-2 text-sm text-gray-500">
            <button onClick={() => setLocation(`/meal-plans/${planId}`)} className="transition hover:text-primary">Meal Plans</button>
            <span>/</span><span className="font-semibold text-gray-900">Recipe Selection</span>
          </div>
        )}
        {returnToPlanner && !returnToMealPlan && (
          <div className="mb-5 flex items-center gap-2 text-sm text-gray-500">
            <button onClick={() => setLocation(`/meal-planner?ingredients=${encodeURIComponent(available || initialIngredients)}&recommended=${encodeURIComponent(recommended)}&mode=${encodeURIComponent(mode)}`)} className="transition hover:text-primary">Meal Planner</button>
            <span>/</span><span className="font-semibold text-gray-900">Recipe Selection</span>
          </div>
        )}

        <section className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-[#173f2b] via-[#23633f] to-[#367c4e] px-6 py-9 text-white shadow-sm sm:px-10 sm:py-12">
          <div className="relative z-10 max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold tracking-wide text-green-50">
              <Utensils className="h-4 w-4" /> MEALMATE RECIPE DISCOVERY
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Find your next favourite meal.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-green-50/90 sm:text-base">
              Explore recipes, discover something new, or find a delicious way to use the ingredients you already have.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={() => document.getElementById("recipe-search")?.focus()} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-green-900 transition hover:bg-green-50">
                <Search className="h-4 w-4" /> Explore recipes
              </button>
              <button onClick={() => setShowGenerator(true)} className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/20">
                <Sparkles className="h-4 w-4" /> Create with AI
              </button>
            </div>
          </div>
          <ChefHat className="absolute -bottom-10 -right-5 h-56 w-56 rotate-[-12deg] text-white/[0.08] sm:right-10 sm:h-72 sm:w-72" />
        </section>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">A little inspiration for every meal</p>
            <h2 className="mt-1 text-2xl font-black text-gray-900">Explore recipes</h2>
            <p className="mt-1 text-sm text-gray-500">{loading ? "Loading your recipe collection..." : `${filteredRecipes.length} recipes to explore`}</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
            <TrendingUp className="h-4 w-4 text-primary" /> Discover what people love
          </div>
        </div>

        <div className="mb-5 flex flex-col gap-3 lg:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input id="recipe-search" type="text" placeholder="Search by recipe name, description or ingredient..." value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-2xl border border-gray-200 bg-white py-3.5 pl-12 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-green-100" />
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 text-xs text-gray-500">
              <Leaf className="h-4 w-4 text-primary" />
              <select aria-label="Filter by diet" value={diet} onChange={(event) => setDiet(event.target.value)} className="max-w-32 bg-transparent py-3.5 text-sm font-semibold text-gray-700 outline-none">
                {DIET_OPTIONS.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 text-xs text-gray-500">
              <Clock className="h-4 w-4 text-primary" />
              <select aria-label="Filter by preparation time" value={timeLimit} onChange={(event) => setTimeLimit(event.target.value)} className="bg-transparent py-3.5 text-sm font-semibold text-gray-700 outline-none">
                <option>Any time</option><option value="15">15 min or less</option><option value="30">30 min or less</option><option value="45">45 min or less</option>
              </select>
            </label>
            <label className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 text-xs text-gray-500">
              <ArrowUpDown className="h-4 w-4 text-primary" />
              <select aria-label="Sort recipes" value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="bg-transparent py-3.5 text-sm font-semibold text-gray-700 outline-none">
                {SORT_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
          </div>
        </div>

        <div className="mb-7">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-800"><SlidersHorizontal className="h-4 w-4 text-primary" /> Browse by category</div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((item) => (
              <button key={item} onClick={() => setCategory(item)} className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${category === item ? "border-primary bg-primary text-white shadow-sm" : "border-gray-200 bg-white text-gray-600 hover:border-green-300 hover:text-primary"}`}>
                {item}
              </button>
            ))}
          </div>
        </div>

        {searchTerms.length > 0 && (
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-gray-500">Search terms</span>
            {searchTerms.map((term) => <span key={term} className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-primary">{term}</span>)}
          </div>
        )}

        {showGenerator && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 px-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowGenerator(false); }}>
            <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-4 shadow-xl">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0"><div className="flex items-center gap-2"><Sparkles className="h-4 w-4 shrink-0 text-primary" /><h2 className="text-base font-bold text-gray-900">Generate Recipe</h2></div>{mealName && <p className="mt-1 truncate text-xs font-semibold text-primary">{mealName}</p>}</div>
                <button onClick={() => setShowGenerator(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-700" title="Close"><X className="h-4 w-4" /></button>
              </div>
              <div className="mt-2 rounded-xl border border-green-100 bg-green-50 p-3"><p className="mb-2 text-xs font-semibold text-gray-600">Full ingredient list</p><p className="text-sm leading-relaxed text-gray-700">{initialIngredients || "No selected-meal ingredients were provided."}</p><p className="mt-2 text-[11px] text-gray-500">Includes the ingredients for the complete recipe, whether you already have them or need to buy them.</p></div>
              {generating && <p className="mt-3 text-xs text-gray-500" role="status">{generationSlow ? "The AI service is taking longer than usual. MealMate is preparing a quick backup recipe." : "Creating your recipe. This usually takes a few seconds."}</p>}
              <div className="mt-3 flex justify-end gap-2"><button onClick={() => setShowGenerator(false)} className="rounded-lg border border-gray-200 px-3.5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button><button onClick={generateRecipe} disabled={generating} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">{generating ? (generationSlow ? "Preparing quick recipe..." : "Generating...") : "Generate"}</button></div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">{[1, 2, 3, 4, 5, 6].map((item) => <div key={item} className="h-32 animate-pulse rounded-2xl bg-white" />)}</div>
        ) : filteredRecipes.length === 0 ? (
          <div className="rounded-3xl border border-gray-100 bg-white px-6 py-14 text-center">
            <ChefHat className="mx-auto h-12 w-12 text-gray-300" />
            <h2 className="mt-4 text-xl font-bold text-gray-900">No recipes found</h2>
            <p className="mt-2 text-sm text-gray-500">Try changing your search or filters to discover more meals.</p>
            <button onClick={clearFilters} className="mt-5 rounded-xl bg-green-50 px-4 py-2.5 text-sm font-bold text-primary hover:bg-green-100">Clear all filters</button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRecipes.map((recipe) => (
              <article key={recipe._id} className="group flex min-h-28 items-stretch gap-3 overflow-hidden rounded-2xl border border-gray-100 bg-white p-3 shadow-sm transition hover:border-green-200 hover:shadow-md sm:gap-4">
                <button type="button" onClick={() => setLocation(`/recipes/${recipe._id}`)} className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-green-50 to-emerald-100 text-left sm:h-32 sm:w-32">
                  {recipeImages[recipe._id] ? (
                    <img src={recipeImages[recipe._id]} alt={recipe.name} loading="lazy" data-image-attempt="0"
                      onError={(event) => {
                        const image = event.currentTarget;
                        const candidates = getRecipeImageCandidates(recipe);
                        const attempt = Number(image.dataset.imageAttempt || 0);
                        if (attempt < candidates.length - 1) {
                          const currentIndex = candidates.indexOf(image.src);
                          image.dataset.imageAttempt = String(attempt + 1);
                          image.src = candidates[(currentIndex + 1 + candidates.length) % candidates.length];
                        } else {
                          image.style.display = "none";
                          setRecipeImages((current) => { const next = { ...current }; delete next[recipe._id]; return next; });
                        }
                      }}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-2 text-center">
                      <Utensils className="h-7 w-7 text-green-600" />
                      <span className="line-clamp-2 text-[10px] font-bold text-gray-700">{recipe.name}</span>
                    </div>
                  )}
                  {recipe.isHighlyLiked && <span className="absolute bottom-1 left-1 rounded-full bg-amber-400 px-1.5 py-0.5 text-[9px] font-bold text-amber-950">Popular</span>}
                </button>
                <div className="flex min-w-0 flex-1 flex-col justify-center py-0.5">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-bold capitalize text-green-800">{recipe.category || "Recipe"}</span>
                    {recipe.diet && <span className="text-[10px] font-medium text-gray-500">{recipe.diet}</span>}
                  </div>
                  <button type="button" onClick={() => setLocation(`/recipes/${recipe._id}`)} className="text-left">
                    <h3 className="line-clamp-1 text-base font-extrabold text-gray-900 transition group-hover:text-primary sm:text-lg">{recipe.name}</h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500 sm:text-sm">{recipe.description || "Discover the ingredients and steps for this recipe."}</p>
                  </button>
                  {recipe.slogan && <p className="mt-1 line-clamp-1 text-[11px] italic text-primary">“{recipe.slogan}”</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500 sm:text-xs">
                    <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{recipe.prepTime || "Time varies"}</span>
                    <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{recipe.averageRating ? recipe.averageRating.toFixed(1) : "New"}{recipe.ratingCount ? ` (${recipe.ratingCount})` : ""}</span>
                  </div>
                </div>
                <button type="button" onClick={() => toggleFavorite(recipe._id)} aria-label={favorites.includes(recipe._id) ? "Remove from favorites" : "Add to favorites"} title={favorites.includes(recipe._id) ? "Remove from favorites" : "Add to favorites"} className="self-start rounded-full p-2 transition hover:bg-red-50">
                  <Heart className={`h-5 w-5 ${favorites.includes(recipe._id) ? "fill-red-500 text-red-500" : "text-gray-300 hover:text-red-400"}`} />
                </button>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
