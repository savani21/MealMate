import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Sparkles, Target, ShoppingBasket, ThumbsUp, CheckCircle2, ChefHat } from "lucide-react";

const API = "http://localhost:5000/api/meal-plans";

export default function MealPlanner() {
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const [goal, setGoal] = useState("");
  const [diet, setDiet] = useState("");
  const [ingredients, setIngredients] = useState(params.get("ingredients") || "");
  const [duration, setDuration] = useState("3");
  const [ingredientMode, setIngredientMode] = useState(params.get("mode") || "available");
  const [recommendedIngredients, setRecommendedIngredients] = useState(params.get("recommended") ? params.get("recommended").split(",").filter(Boolean) : []);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [draftDays, setDraftDays] = useState([]);
  const [previewReady, setPreviewReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch("http://localhost:5000/api/auth/profile", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.user?.foodPreference && !params.get("diet")) {
          setDiet(data.user.foodPreference);
        }
      })
      .catch((error) => console.error("Failed to load food preference:", error));
  }, []);

  const handleDietChange = (value) => {
    setDiet(value);
    setRecommendedIngredients([]);
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch("http://localhost:5000/api/auth/profile", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ foodPreference: value }),
    }).catch((error) => console.error("Failed to save food preference:", error));
  };

  const getRecommendedIngredients = async () => {
    if (recommendedIngredients.length > 0) return recommendedIngredients;
    try {
      setRecommendationLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/recipes/recommended", { headers: token ? { Authorization: `Bearer ${token}` } : {} });
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

  const buildPayload = async () => {
    const available = getAvailableIngredients();
    let recommendedToUse = [];
    let finalIngredients = available;
    if (ingredientMode === "recommended") {
      recommendedToUse = await getRecommendedIngredients();
      finalIngredients = [...new Set([...available, ...recommendedToUse])];
    }
    return {
      goal, diet, duration: Number(duration),
      availableIngredients: available.join(", "),
      recommendedIngredients: recommendedToUse.join(", "),
      ingredientMode,
      ingredients: finalIngredients.join(", "),
    };
  };

  const generatePlan = async () => {
    if (!goal || !diet) { alert("Please select your goal and diet type."); return; }
    if (getAvailableIngredients().length === 0) { alert("Enter your available ingredients first."); return; }
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) { alert("Please login again."); setLocation("/login"); return; }
      const payload = await buildPayload();
      const response = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...payload, previewOnly: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to generate recipe choices");
      if (!Array.isArray(data.days) || !data.days.length) throw new Error("No recipe choices were returned. Please try again.");
      setDraftDays(data.days.map((day) => {
        const copy = { ...day };
        ["breakfast", "lunch", "dinner"].forEach((type) => {
          const options = Array.isArray(copy[type + "Options"]) ? copy[type + "Options"].slice(0, 3) : [];
          copy[type + "Options"] = options;
          const selected = options.find((option) => option.name === copy[type]) || options[0];
          if (selected) {
            copy[type] = selected.name;
            copy[type + "Ingredients"] = selected.ingredients || [];
          }
        });
        return copy;
      }));
      setPreviewReady(true);
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    } catch (error) {
      console.error("Meal plan preview error:", error);
      alert(error.message || "Unable to generate recipe choices.");
    } finally { setLoading(false); }
  };

  const selectOption = (dayIndex, mealType, option) => {
    setDraftDays((current) => current.map((day, index) => index !== dayIndex ? day : ({
      ...day,
      [mealType]: option.name,
      [mealType + "Ingredients"]: option.ingredients || [],
    })));
  };

  const saveSelectedPlan = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const payload = await buildPayload();
      const response = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...payload, selectedDays: draftDays }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to save meal plan");
      if (!data.mealPlan?._id) throw new Error("Meal plan was saved but no plan ID was returned.");
      setLocation(`/meal-plans/${data.mealPlan._id}`);
    } catch (error) {
      console.error("Save meal plan error:", error);
      alert(error.message || "Unable to save your selected meal plan.");
    } finally { setLoading(false); }
  };


  const [recommendedRecipes, setRecommendedRecipes] = useState([]);
  const [recommendationLoading, setRecommendationLoading] = useState(false);

  const fetchRecommendedRecipes = async () => {
    const available = ingredients.split(",").map((item) => item.trim()).filter(Boolean);
    if (!available.length || !diet) {
      setRecommendedRecipes([]);
      return;
    }
    try {
      setRecommendationLoading(true);
      const query = new URLSearchParams({
        available: available.join(","),
        recommended: recommendedIngredients.join(","),
        mode: ingredientMode,
        diet,
      });
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/recipes/recommended?" + query.toString(), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to get recommendations");
      setRecommendedRecipes(data.recipes || []);
    } catch (error) {
      console.error("Recipe recommendation error:", error);
      setRecommendedRecipes([]);
    } finally {
      setRecommendationLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchRecommendedRecipes, 450);
    return () => clearTimeout(timer);
  }, [ingredients, diet, ingredientMode, recommendedIngredients.join(",")]);

  return (
    <div className="min-h-screen bg-[#f7faf7]">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30"><div className="w-full px-4 sm:px-6 lg:px-8"><div className="h-20 flex items-center justify-between gap-6"><div className="flex items-center gap-2 shrink-0"><Sparkles className="w-6 h-6 text-primary" /><span className="text-xl font-black text-gray-900">Meal<span className="text-primary">Mate</span></span></div><nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto text-sm font-semibold"><NavLink label="Dashboard" onClick={() => setLocation("/dashboard")} /><NavLink label="Meal Planner" active onClick={() => setLocation("/meal-planner")} /><NavLink label="Pantry" onClick={() => setLocation("/pantry")} /><NavLink label="Meal Plans" onClick={() => setLocation("/my-meal-plans")} /><NavLink label="Recipes" onClick={() => setLocation("/recipes")} /></nav></div></div></header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <section className="text-center mb-10"><div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-primary text-sm font-semibold"><Sparkles className="w-4 h-4" /> Fast Indian Meal Suggestions</div><h1 className="text-3xl md:text-4xl font-black text-gray-900 mt-4">Smart Meal Planner</h1><p className="text-gray-500 mt-3 max-w-2xl mx-auto">Choose your preferences, review recipe ideas for every meal, and select exactly what you want.</p></section>
        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-10">
          <div className="flex items-center gap-3 mb-8"><div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center"><Target className="w-6 h-6 text-primary" /></div><div><h2 className="text-xl font-black text-gray-900">Meal Plan Preferences</h2><p className="text-sm text-gray-500">Tell MealMate what works for you.</p></div></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label className="block text-sm font-semibold text-gray-700 mb-2">Goal</label><select value={goal} onChange={(e) => {setGoal(e.target.value);setPreviewReady(false);}} className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white outline-none focus:border-primary"><option value="">Select your goal</option><option value="weight-loss">Weight Loss</option><option value="weight-gain">Weight Gain</option><option value="muscle-gain">Muscle Gain</option><option value="healthy-eating">Healthy Eating</option><option value="maintenance">Maintain Weight</option></select></div>
            <div><label className="block text-sm font-semibold text-gray-700 mb-2">Diet Type</label><select value={diet} onChange={(e) => {handleDietChange(e.target.value);setPreviewReady(false);}} className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white outline-none focus:border-primary"><option value="">Select diet type</option><option value="vegetarian">Vegetarian</option><option value="vegan">Vegan</option><option value="non-vegetarian">Non-Vegetarian</option><option value="eggetarian">Eggetarian</option></select></div>
            <div><label className="block text-sm font-semibold text-gray-700 mb-2">Plan Duration</label><select value={duration} onChange={(e) => {setDuration(e.target.value);setPreviewReady(false);}} className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white outline-none focus:border-primary"><option value="1">1 Day</option><option value="3">3 Days</option><option value="7">7 Days</option></select></div>
            <div><label className="block text-sm font-semibold text-gray-700 mb-2">Ingredients You Already Have</label><div className="relative"><ShoppingBasket className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" /><input type="text" value={ingredients} onChange={(e) => {setIngredients(e.target.value);setPreviewReady(false);}} placeholder="e.g. rice, paneer, tomato, spinach" className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 outline-none focus:border-primary" /></div><p className="text-xs text-gray-400 mt-2">These ingredients will be passed to the recipe generator automatically. You won't need to enter them again.</p></div>
          </div>
          <div className="mt-8 border-t border-gray-100 pt-8"><h3 className="font-black text-gray-900 text-lg mb-4">How should we plan your meals?</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button type="button" onClick={() => {setIngredientMode("available");setPreviewReady(false);}} className={`text-left rounded-2xl border-2 p-5 transition ${ingredientMode === "available" ? "border-primary bg-green-50" : "border-gray-100 hover:border-gray-200"}`}><div className="flex items-center gap-3"><ShoppingBasket className="w-5 h-5 text-primary" /><span className="font-bold text-gray-900">Only Available Ingredients</span></div><p className="text-sm text-gray-500 mt-2">Use only the ingredients you already have.</p>{ingredientMode === "available" && <p className="text-sm font-semibold text-primary mt-4">Selected</p>}</button>
            <button type="button" onClick={async () => {setIngredientMode("recommended");setPreviewReady(false);await getRecommendedIngredients();}} className={`text-left rounded-2xl border-2 p-5 transition ${ingredientMode === "recommended" ? "border-primary bg-green-50" : "border-gray-100 hover:border-gray-200"}`}><div className="flex items-center gap-3"><ThumbsUp className="w-5 h-5 text-primary" /><span className="font-bold text-gray-900">Available + Recommended Ingredients</span></div><p className="text-sm text-gray-500 mt-2">Use your ingredients plus suggested ingredients you can purchase.</p>{recommendationLoading ? <p className="text-sm text-primary font-semibold mt-4">Loading recommendations...</p> : recommendedIngredients.length > 0 ? <div className="flex flex-wrap gap-2 mt-4">{recommendedIngredients.slice(0, 8).map((item) => <span key={item} className="px-2.5 py-1 rounded-full bg-white border border-green-100 text-xs font-medium text-gray-600">{item}</span>)}</div> : <p className="text-xs text-gray-400 mt-4">Suggestions are based on popular recipes.</p>}{ingredientMode === "recommended" && !recommendationLoading && <p className="text-sm font-semibold text-primary mt-4">Selected</p>}</button>
          </div></div>

          <section className="mt-8 border-t border-gray-100 pt-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-black text-gray-900 text-lg">Recommended Recipes</h3>
                <p className="text-sm text-gray-500">Suggestions based on your ingredients, food preference and ratings.</p>
              </div>
              {recommendationLoading && <span className="text-xs font-semibold text-primary">Updating...</span>}
            </div>
            {recommendedRecipes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {recommendedRecipes.slice(0, 3).map((recipe) => (
                  <div key={recipe._id} className="rounded-xl border border-gray-100 p-4 bg-gray-50">
                    <h4 className="font-bold text-gray-900">{recipe.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">{recipe.description}</p>
                    <div className="flex flex-wrap gap-2 mt-3 text-xs">
                      <span className="rounded-full bg-white px-2 py-1">{recipe.matchPercentage || 0}% ingredient match</span>
                      <span className="rounded-full bg-white px-2 py-1">{recipe.averageRating || 0}/5 ({recipe.ratingCount || 0})</span>
                    </div>
                    {recipe.missingIngredients?.length > 0 && <p className="text-xs text-amber-700 mt-2">Missing: {recipe.missingIngredients.join(", ")}</p>}
                    <button type="button" onClick={() => setLocation(`/recipes/${recipe._id}`)} className="mt-3 text-sm font-semibold text-primary hover:underline">View recipe</button>
                  </div>
                ))}
              </div>
            ) : !recommendationLoading ? (
              <p className="text-sm text-gray-400">Add ingredients and select a food preference to see recipe suggestions.</p>
            ) : null}
          </section>
          <div className="mt-8 pt-6 border-t border-gray-100"><button onClick={generatePlan} disabled={loading || recommendationLoading} className="w-full md:w-auto md:min-w-[280px] mx-auto flex items-center justify-center gap-2 bg-primary text-white px-6 py-3.5 rounded-xl font-bold hover:opacity-90 transition disabled:opacity-60"><Sparkles className="w-5 h-5" />{loading ? "Preparing Recipe Options..." : "Show My Recipe Options"}</button></div>
        </section>

        {previewReady && <section className="mt-10 space-y-6">
          <div className="text-center"><div className="inline-flex items-center gap-2 text-primary text-sm font-semibold"><CheckCircle2 className="w-4 h-4"/> Your preferences are applied</div><h2 className="text-2xl font-black text-gray-900 mt-2">Choose Your Recipes</h2><p className="text-sm text-gray-500 mt-2">Select one recipe for breakfast, lunch and dinner. Your chosen ingredients are already included.</p></div>
          {draftDays.map((day, dayIndex) => <div key={day.day || dayIndex} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-7"><div className="flex items-center gap-2 mb-5"><div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center"><ChefHat className="w-5 h-5 text-primary"/></div><h3 className="text-lg font-black text-gray-900">Day {day.day || dayIndex + 1}</h3></div><div className="grid grid-cols-1 lg:grid-cols-3 gap-5">{["breakfast","lunch","dinner"].map((type) => <div key={type} className="rounded-2xl border border-gray-100 p-4"><div className="text-xs font-bold uppercase tracking-wide text-primary mb-3">{type}</div><div className="space-y-2">{(day[type + "Options"] || []).map((option, optionIndex) => <label key={option.name + optionIndex} className={`block rounded-xl border p-3 cursor-pointer transition ${day[type] === option.name ? "border-primary bg-green-50" : "border-gray-100 hover:border-green-200"}`}><span className="flex items-start gap-2.5"><input type="radio" name={`day-${dayIndex}-${type}`} checked={day[type] === option.name} onChange={() => selectOption(dayIndex, type, option)} className="mt-1 accent-green-700"/><span className="min-w-0"><span className="block font-bold text-sm text-gray-900">{option.name}</span>{option.description && <span className="block text-xs text-gray-500 mt-1">{option.description}</span>}{option.prepTime && <span className="block text-[11px] text-primary mt-2">{option.prepTime}</span>}</span></span></label>)}</div>{(day[type + "Options"] || []).length === 0 && <p className="text-sm text-red-500">No options returned for this meal. Please regenerate.</p>}</div>)}</div></div>)}
          <div className="flex flex-col sm:flex-row justify-center gap-3"><button onClick={() => {setPreviewReady(false);setDraftDays([]);}} className="px-6 py-3 rounded-xl border border-gray-200 font-semibold text-gray-600">Change Preferences</button><button onClick={saveSelectedPlan} disabled={loading} className="px-7 py-3 rounded-xl bg-primary text-white font-bold disabled:opacity-60">{loading ? "Saving Your Choices..." : "Save Selected Meal Plan"}</button></div>
        </section>}
      </main>
    </div>
  );
}
function NavLink({ label, active, onClick }) { return <button onClick={onClick} className={`px-3 py-2 rounded-lg whitespace-nowrap transition ${active ? "bg-green-50 text-primary" : "text-gray-600 hover:bg-gray-50 hover:text-primary"}`}>{label}</button>; }
