import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Sparkles, Target, ShoppingBasket, ThumbsUp, ChefHat, Clock, Heart, ArrowRight } from "lucide-react";

export default function MealPlanner() {
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const returningToPlanner = params.get("return") === "meal-planner";

  // A normal entry into Meal Planner starts a fresh form.
  // Only restore the draft when the user is explicitly returning from
  // a recipe/meal-plan flow.
  if (!returningToPlanner) {
    sessionStorage.removeItem("mealPlannerDraft");
  }

  const savedDraft = (() => {
    if (!returningToPlanner) return {};
    try {
      return JSON.parse(sessionStorage.getItem("mealPlannerDraft") || "null") || {};
    } catch {
      return {};
    }
  })();

  const [goal, setGoal] = useState(params.get("goal") || savedDraft.goal || "");
  const [diet, setDiet] = useState(params.get("diet") || savedDraft.diet || "");
  const [ingredients, setIngredients] = useState(params.get("ingredients") || savedDraft.ingredients || "");
  const [duration, setDuration] = useState(params.get("duration") || savedDraft.duration || "3");
  const [ingredientMode, setIngredientMode] = useState(params.get("mode") || savedDraft.ingredientMode || "available");
  const [recommendedIngredients, setRecommendedIngredients] = useState(
    params.get("recommended")
      ? params.get("recommended").split(",").filter(Boolean)
      : savedDraft.recommendedIngredients || []
  );
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [recommendedRecipes, setRecommendedRecipes] = useState([]);
  const [loading, setLoading] = useState(false);

  // Keep the planner form alive while the user opens recipe or meal-plan pages.
  // sessionStorage survives route changes/browser back navigation but is cleared
  // when the browser session ends.
  useEffect(() => {
    sessionStorage.setItem(
      "mealPlannerDraft",
      JSON.stringify({
        goal,
        diet,
        ingredients,
        duration,
        ingredientMode,
        recommendedIngredients,
      })
    );
  }, [goal, diet, ingredients, duration, ingredientMode, recommendedIngredients.join(",")]);

  const getRecommendedIngredients = async () => {
    if (recommendedIngredients.length > 0) return recommendedIngredients;
    try {
      setRecommendationLoading(true);
      const response = await fetch("http://localhost:5000/api/recipes/recommended");
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to get recommendations");
      setRecommendedIngredients(data.ingredients || []);
      return data.ingredients || [];
    } catch (error) {
      console.error("Recommendation error:", error);
      alert("Unable to load recommended ingredients.");
      return [];
    } finally { setRecommendationLoading(false); }
  };
  const getAvailableIngredients = () => ingredients.split(",").map((item) => item.trim()).filter(Boolean);
  const fetchRecommendedRecipes = async () => {
    const available = getAvailableIngredients();
    if (available.length === 0) { setRecommendedRecipes([]); return; }
    try {
      setRecommendationLoading(true);
      const params = new URLSearchParams({ available: available.join(","), recommended: recommendedIngredients.join(","), mode: ingredientMode });
      const response = await fetch("http://localhost:5000/api/recipes/recommended?" + params.toString());
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to get recipe recommendations");
      setRecommendedRecipes(data.recipes || []);
    } catch (error) {
      console.error("Recipe recommendation error:", error);
      setRecommendedRecipes([]);
    } finally { setRecommendationLoading(false); }
  };
  useEffect(() => {
    const timer = setTimeout(fetchRecommendedRecipes, 350);
    return () => clearTimeout(timer);
  }, [ingredients, ingredientMode, recommendedIngredients.join(",")]);
  const generatePlan = async () => {
    if (!goal || !diet) { alert("Please select your goal and diet type."); return; }
    const available = getAvailableIngredients();
    if (available.length === 0) { alert("Enter your available ingredients first."); return; }
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) { alert("Please login again."); setLocation("/login"); return; }
      let finalIngredients = available;
      let recommendedToUse = [];
      if (ingredientMode === "recommended") {
        const recommended = await getRecommendedIngredients();
        recommendedToUse = recommended;
        finalIngredients = [...new Set([...available, ...recommended])];
      }
      const response = await fetch("http://localhost:5000/api/meal-plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          goal,
          diet,
          duration: Number(duration),

          // Keep pantry ingredients separate from ingredients that may be bought.
          availableIngredients: available.join(", "),
          recommendedIngredients: recommendedToUse.join(", "),
          ingredientMode,

          // Backward-compatible field for older backend code.
          ingredients: available.join(", "),
        }),
      });
      const data = await response.json();
      if (!response.ok) { alert(data.message || "Failed to generate meal plan"); return; }
      if (!data.mealPlan?._id) { alert("Meal plan was generated but no plan ID was returned."); return; }
      setLocation(`/meal-plans/${data.mealPlan._id}`);
    } catch (error) { console.error("Meal plan error:", error); alert("Unable to connect to server."); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#f7faf7]">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30"><div className="w-full px-4 sm:px-6 lg:px-8"><div className="h-20 flex items-center justify-between gap-6"><div className="flex items-center gap-2 shrink-0"><Sparkles className="w-6 h-6 text-primary" /><span className="text-xl font-black text-gray-900">Meal<span className="text-primary">Mate</span></span></div><nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto text-sm font-semibold"><NavLink label="Dashboard" onClick={() => setLocation("/dashboard")} /><NavLink label="Meal Planner" active onClick={() => setLocation("/meal-planner")} /><NavLink label="Meal Plans" onClick={() => setLocation("/my-meal-plans")} /><NavLink label="Recipes" onClick={() => setLocation("/recipes")} /></nav></div></div></header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <section className="text-center mb-10"><div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-primary text-sm font-semibold"><Sparkles className="w-4 h-4" /> Powered by AI</div><h1 className="text-3xl md:text-4xl font-black text-gray-900 mt-4">AI Meal Planner</h1><p className="text-gray-500 mt-3 max-w-2xl mx-auto">Create a practical meal plan around your preferences and the ingredients you have.</p></section>
        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-10"><div className="flex items-center gap-3 mb-8"><div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center"><Target className="w-6 h-6 text-primary" /></div><div><h2 className="text-xl font-black text-gray-900">Meal Plan Preferences</h2><p className="text-sm text-gray-500">Choose how MealMate should use your ingredients.</p></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div><label className="block text-sm font-semibold text-gray-700 mb-2">Goal</label><select value={goal} onChange={(e) => setGoal(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white outline-none focus:border-primary"><option value="">Select your goal</option><option value="weight-loss">Weight Loss</option><option value="weight-gain">Weight Gain</option><option value="muscle-gain">Muscle Gain</option><option value="healthy-eating">Healthy Eating</option><option value="maintenance">Maintain Weight</option></select></div>
          <div><label className="block text-sm font-semibold text-gray-700 mb-2">Diet Type</label><select value={diet} onChange={(e) => setDiet(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white outline-none focus:border-primary"><option value="">Select diet type</option><option value="vegetarian">Vegetarian</option><option value="vegan">Vegan</option><option value="non-vegetarian">Non-Vegetarian</option><option value="eggetarian">Eggetarian</option></select></div>
          <div><label className="block text-sm font-semibold text-gray-700 mb-2">Plan Duration</label><select value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white outline-none focus:border-primary"><option value="1">1 Day</option><option value="3">3 Days</option><option value="7">7 Days</option></select></div>
          <div><label className="block text-sm font-semibold text-gray-700 mb-2">Available Ingredients</label><div className="relative"><ShoppingBasket className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" /><input type="text" value={ingredients} onChange={(e) => setIngredients(e.target.value)} placeholder="e.g. rice, paneer, tomato, spinach" className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 outline-none focus:border-primary" /></div><p className="text-xs text-gray-400 mt-2">Separate ingredients with commas.</p></div>
        </div><div className="mt-8 border-t border-gray-100 pt-8"><h3 className="font-black text-gray-900 text-lg mb-4">How should we plan your meals?</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><button type="button" onClick={() => setIngredientMode("available")} className={`text-left rounded-2xl border-2 p-5 transition ${ingredientMode === "available" ? "border-primary bg-green-50" : "border-gray-100 hover:border-gray-200"}`}><div className="flex items-center gap-3"><ShoppingBasket className="w-5 h-5 text-primary" /><span className="font-bold text-gray-900">Only Available Ingredients</span></div><p className="text-sm text-gray-500 mt-2">Plan meals using only the ingredients you already have. Nothing extra is added to the plan.</p>{ingredientMode === "available" && <p className="text-sm font-semibold text-primary mt-4">Selected</p>}</button><button type="button" onClick={async () => { setIngredientMode("recommended"); await getRecommendedIngredients(); }} className={`text-left rounded-2xl border-2 p-5 transition ${ingredientMode === "recommended" ? "border-primary bg-green-50" : "border-gray-100 hover:border-gray-200"}`}><div className="flex items-center gap-3"><ThumbsUp className="w-5 h-5 text-primary" /><span className="font-bold text-gray-900">Available + Recommended Ingredients</span></div><p className="text-sm text-gray-500 mt-2">Plan meals with what you have plus popular ingredients. Missing ingredients can be purchased from the MealMate Grocery Store.</p>{recommendationLoading ? <p className="text-sm text-primary font-semibold mt-4">Loading recommended ingredients...</p> : recommendedIngredients.length > 0 ? <div className="flex flex-wrap gap-2 mt-4">{recommendedIngredients.slice(0, 8).map((item) => <span key={item} className="px-2.5 py-1 rounded-full bg-white border border-green-100 text-xs font-medium text-gray-600">{item}</span>)}</div> : <p className="text-xs text-gray-400 mt-4">Recommended ingredients come from recipes liked by users.</p>}{ingredientMode === "recommended" && !recommendationLoading && <p className="text-sm font-semibold text-primary mt-4">Selected</p>}</button></div></div><section className="mt-8 border-t border-gray-100 pt-7">
  <div className="flex items-start justify-between gap-4 mb-4">
    <div>
      <div className="flex items-center gap-2"><ChefHat className="w-5 h-5 text-primary" /><h3 className="font-black text-gray-900 text-lg">Recommended Recipes</h3></div>
      <p className="text-sm text-gray-500 mt-1">Top recipes that fit your {ingredientMode === "recommended" ? "available + recommended" : "available"} ingredients, ranked by ingredient match, favorites, and meal-plan usage.</p>
    </div>
    {recommendationLoading && <span className="text-xs font-semibold text-primary">Updating...</span>}
  </div>
  {recommendedRecipes.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {recommendedRecipes.slice(0, 3).map((recipe) => <article key={recipe._id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-primary/30 transition">
      <div className="h-28 bg-green-50 flex items-center justify-center overflow-hidden">{recipe.image ? <img src={recipe.image} alt={recipe.name} className="w-full h-full object-cover" /> : <ChefHat className="w-10 h-10 text-primary/60" />}</div>
      <div className="p-4">
        <h4 className="font-bold text-gray-900 truncate">{recipe.name}</h4>
        <p className="text-xs text-gray-500 mt-1 line-clamp-2 min-h-[32px]">{recipe.description || "A popular MealMate recipe."}</p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          <span className="px-2 py-1 rounded-full bg-green-50 text-primary text-[11px] font-semibold">{recipe.matchPercentage}% ingredient match</span>
          {recipe.favoriteCount > 0 && <span className="px-2 py-1 rounded-full bg-red-50 text-red-600 text-[11px] font-semibold inline-flex items-center gap-1"><Heart className="w-3 h-3 fill-current" /> {recipe.favoriteCount} likes</span>}
          {recipe.usageCount > 0 && <span className="px-2 py-1 rounded-full bg-gray-50 text-gray-600 text-[11px] font-semibold">{recipe.usageCount} uses</span>}
        </div>
        <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
          {recipe.prepTime && <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{recipe.prepTime}</span>}
          <button type="button" onClick={() => { const query = new URLSearchParams({ return: "meal-planner", available: getAvailableIngredients().join(","), recommended: recommendedIngredients.join(","), mode: ingredientMode }); setLocation("/recipes/" + recipe._id + "?" + query.toString()); }} className="ml-auto inline-flex items-center gap-1 text-primary font-semibold hover:underline">View Recipe <ArrowRight className="w-3.5 h-3.5" /></button>
        </div>
      </div>
    </article>)}
  </div> : <p className="text-sm text-gray-400">No matching recipes found for these ingredients yet.</p>}
</section>
<div className="mt-8 pt-6 border-t border-gray-100"><button onClick={generatePlan} disabled={loading || recommendationLoading} className="w-full md:w-auto md:min-w-[260px] mx-auto flex items-center justify-center gap-2 bg-primary text-white px-6 py-3.5 rounded-xl font-bold hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed"><Sparkles className="w-5 h-5" />{loading ? "Generating Your Meal Plan..." : "Generate AI Meal Plan"}</button></div></section>
      </main>
    </div>
  );
}
function NavLink({ label, active, onClick }) { return <button onClick={onClick} className={`px-3 py-2 rounded-lg whitespace-nowrap transition ${active ? "bg-green-50 text-primary" : "text-gray-600 hover:bg-gray-50 hover:text-primary"}`}>{label}</button>; }