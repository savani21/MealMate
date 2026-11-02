import AppNavbar from "@/components/AppNavbar";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Sparkles, Target, ShoppingBasket, ThumbsUp, CheckCircle2, ChefHat } from "lucide-react";

const API = "http://localhost:5000/api/meal-plans";

export default function MealPlanner() {
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const [weekStart, setWeekStart] = useState(() => {
    const requested = params.get("week");
    const date = requested && /^\d{4}-\d{2}-\d{2}$/.test(requested) ? new Date(requested + "T12:00:00") : new Date();
    const monday = new Date(date);
    monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });
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
  const recipeChoicesRef = useRef(null);

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
      const query = new URLSearchParams({ diet });
      const response = await fetch("http://localhost:5000/api/recipes/recommended?" + query.toString(), { headers: token ? { Authorization: `Bearer ${token}` } : {} });
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

    } catch (error) {
      console.error("Meal plan preview error:", error);
      alert(error.message || "Unable to generate recipe choices.");
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (previewReady) recipeChoicesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [previewReady]);

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

  const fetchRecommendedRecipes = async () => {
    const available = getAvailableIngredients();
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
  
  const formatDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
  };
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });
  const changeWeek = (offset) => {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + offset * 7);
    setWeekStart(next);
    setLocation("/meal-planner?week=" + formatDateKey(next));
  };
  const weekLabel = weekDays[0].toLocaleDateString([], { month: "short", day: "numeric" }) + " – " +
    weekDays[6].toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="min-h-screen bg-[#f8faf7]">
      <AppNavbar />
      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        <section className="mb-7 rounded-3xl bg-[#173f32] px-6 py-8 text-white md:px-9 md:py-10">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-200">MealMate · My Kitchen</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">Your recipes. Your week. Your kitchen.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-green-50/85 md:text-base">Build a meal plan that fits your preferences, make the week yours, and keep your ingredients in sync.</p>
            <button onClick={() => document.getElementById("meal-preferences")?.scrollIntoView({ behavior: "smooth", block: "start" })} className="mt-6 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#173f32] transition hover:bg-green-50">Plan my meals <span aria-hidden="true">→</span></button>
          </div>
        </section>

        <section className="mb-7 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-xs font-bold uppercase tracking-wider text-primary">Your weekly planner</p><h2 className="mt-1 text-xl font-black text-gray-900">What’s on the menu?</h2><p className="mt-1 text-sm text-gray-500">{weekLabel}</p></div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => changeWeek(-1)} aria-label="Previous week" className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-primary hover:text-primary">← <span className="hidden sm:inline">Previous</span></button>
              <button type="button" onClick={() => { const today = new Date(); today.setDate(today.getDate() - ((today.getDay() + 6) % 7)); today.setHours(0,0,0,0); setWeekStart(today); setLocation("/meal-planner?week=" + formatDateKey(today)); }} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-primary hover:text-primary">This week</button>
              <button type="button" onClick={() => changeWeek(1)} aria-label="Next week" className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-primary hover:text-primary"><span className="hidden sm:inline">Next</span> →</button>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
            {weekDays.map((date, index) => {
              const day = draftDays[index];
              const isToday = formatDateKey(date) === formatDateKey(new Date());
              return (
                <article key={formatDateKey(date)} className={"min-h-44 rounded-2xl border p-3 " + (isToday ? "border-primary/50 bg-green-50/60" : "border-gray-100 bg-[#fbfcfa]")}>
                  <div className="mb-3 flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{date.toLocaleDateString([], { weekday: "short" })}</p><p className={"text-lg font-black " + (isToday ? "text-primary" : "text-gray-900")}>{date.getDate()}</p></div>{isToday && <span className="rounded-full bg-green-100 px-2 py-1 text-[10px] font-bold text-primary">Today</span>}</div>
                  {day ? <div className="space-y-2">{["breakfast", "lunch", "dinner"].map((type) => <div key={type} className="rounded-xl bg-white p-2.5 shadow-sm"><p className="text-[10px] font-bold uppercase tracking-wide text-primary">{type}</p><p className="mt-1 text-xs font-semibold leading-4 text-gray-800">{day[type] || "No recipe selected"}</p>{(day[type + "Options"] || []).length > 1 && <details className="mt-2"><summary className="cursor-pointer text-[11px] font-semibold text-primary">Change recipe</summary><div className="mt-2 space-y-1.5">{day[type + "Options"].map((option, optionIndex) => <label key={option.name + optionIndex} className="flex cursor-pointer items-start gap-2 text-[11px] text-gray-600"><input type="radio" name={"week-" + index + "-" + type} checked={day[type] === option.name} onChange={() => selectOption(index, type, option)} className="mt-0.5 accent-green-700" /><span>{option.name}</span></label>)}</div></details>}</div>)}</div> : <button type="button" onClick={() => document.getElementById("meal-preferences")?.scrollIntoView({ behavior: "smooth", block: "start" })} className="flex min-h-24 w-full flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white/70 px-2 text-center text-xs font-semibold text-gray-500 transition hover:border-primary hover:text-primary"><span className="mb-1 text-xl leading-none">+</span> Add meals</button>}
                </article>
              );
            })}
          </div>
          <div className="mt-4 flex flex-col gap-2 border-t border-gray-100 pt-4 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between"><span>{previewReady ? "Your generated recipe choices are shown in the calendar. Change any meal before saving." : "Your week is ready to plan. Generate recipe ideas to fill your meal slots."}</span>{previewReady && <button onClick={saveSelectedPlan} disabled={loading} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{loading ? "Saving..." : "Save this meal plan"}</button>}</div>
        </section>

        <section id="meal-preferences" className="scroll-mt-24 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm md:p-8">
          <div className="mb-7 flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50"><Target className="h-5 w-5 text-primary" /></div><div><p className="text-xs font-bold uppercase tracking-wider text-primary">Dinner starts here</p><h2 className="text-xl font-black text-gray-900">Create your meal plan</h2><p className="mt-1 text-sm text-gray-500">Choose your preferences and MealMate will suggest recipes for your week.</p></div></div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div><label className="mb-2 block text-sm font-semibold text-gray-700">Your goal</label><select value={goal} onChange={(e) => {setGoal(e.target.value);setPreviewReady(false);}} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-primary"><option value="">Select your goal</option><option value="weight-loss">Weight Loss</option><option value="weight-gain">Weight Gain</option><option value="muscle-gain">Muscle Gain</option><option value="healthy-eating">Healthy Eating</option><option value="maintenance">Maintain Weight</option></select></div>
            <div><label className="mb-2 block text-sm font-semibold text-gray-700">Diet type</label><select value={diet} onChange={(e) => {handleDietChange(e.target.value);setPreviewReady(false);}} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-primary"><option value="">Select diet type</option><option value="vegetarian">Vegetarian</option><option value="vegan">Vegan</option><option value="non-vegetarian">Non-Vegetarian</option><option value="eggetarian">Eggetarian</option></select></div>
            <div><label className="mb-2 block text-sm font-semibold text-gray-700">Plan duration</label><select value={duration} onChange={(e) => {setDuration(e.target.value);setPreviewReady(false);}} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-primary"><option value="1">1 Day</option><option value="3">3 Days</option><option value="7">7 Days</option></select></div>
            <div><label className="mb-2 block text-sm font-semibold text-gray-700">Ingredients you already have</label><div className="relative"><ShoppingBasket className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" /><input type="text" value={ingredients} onChange={(e) => {setIngredients(e.target.value);setPreviewReady(false);}} placeholder="e.g. rice, paneer, tomato, spinach" className="w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 outline-none focus:border-primary" /></div><p className="mt-2 text-xs text-gray-400">These ingredients are passed to the recipe generator automatically.</p></div>
          </div>
          <div className="mt-7 border-t border-gray-100 pt-6"><h3 className="mb-3 text-base font-black text-gray-900">How should we plan your meals?</h3><div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <button type="button" onClick={() => {setIngredientMode("available");setPreviewReady(false);}} className={"rounded-2xl border-2 p-4 text-left transition " + (ingredientMode === "available" ? "border-primary bg-green-50" : "border-gray-100 hover:border-gray-200")}><span className="flex items-center gap-2 font-bold text-gray-900"><ShoppingBasket className="h-5 w-5 text-primary" /> Only available ingredients</span><p className="mt-2 text-sm text-gray-500">Use only the ingredients you already have.</p>{ingredientMode === "available" && <p className="mt-3 text-xs font-bold text-primary">Selected</p>}</button>
            <button type="button" onClick={async () => {setIngredientMode("recommended");setPreviewReady(false);await getRecommendedIngredients();}} className={"rounded-2xl border-2 p-4 text-left transition " + (ingredientMode === "recommended" ? "border-primary bg-green-50" : "border-gray-100 hover:border-gray-200")}><span className="flex items-center gap-2 font-bold text-gray-900"><ThumbsUp className="h-5 w-5 text-primary" /> Available + recommended</span><p className="mt-2 text-sm text-gray-500">Combine your ingredients with suggested items you can purchase.</p>{recommendationLoading ? <p className="mt-3 text-xs font-semibold text-primary">Loading recommendations...</p> : recommendedIngredients.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{recommendedIngredients.slice(0, 8).map((item) => <span key={item} className="rounded-full border border-green-100 bg-white px-2 py-1 text-xs text-gray-600">{item}</span>)}</div>}</button>
          </div></div>
          <div className="mt-7 border-t border-gray-100 pt-6"><div className="mb-4 flex items-center justify-between gap-3"><div><h3 className="text-base font-black text-gray-900">Recipe ideas for you</h3><p className="mt-1 text-sm text-gray-500">Based on your ingredients, food preference and ratings.</p></div>{recommendationLoading && <span className="text-xs font-semibold text-primary">Updating...</span>}</div>
            {recommendedRecipes.length > 0 ? <div className="grid grid-cols-1 gap-3 md:grid-cols-3">{recommendedRecipes.slice(0, 3).map((recipe) => <article key={recipe._id} className="rounded-2xl border border-gray-100 bg-[#fbfcfa] p-4"><h4 className="font-bold text-gray-900">{recipe.name}</h4><p className="mt-1 text-xs text-gray-500">{recipe.description}</p><div className="mt-3 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-white px-2 py-1">{recipe.matchPercentage || 0}% ingredient match</span><span className="rounded-full bg-white px-2 py-1">{recipe.averageRating || 0}/5 ({recipe.ratingCount || 0})</span></div>{recipe.missingIngredients?.length > 0 && <p className="mt-2 text-xs text-amber-700">Missing: {recipe.missingIngredients.join(", ")}</p>}<button type="button" onClick={() => setLocation("/recipes/" + recipe._id)} className="mt-3 text-sm font-bold text-primary hover:underline">View recipe</button></article>)}</div> : !recommendationLoading ? <p className="text-sm text-gray-400">Add ingredients and select a diet type to see suggestions.</p> : null}
          </div>
          <div className="mt-7 flex flex-col items-start justify-between gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:items-center"><p className="max-w-xl text-xs leading-5 text-gray-500">MealMate will prepare up to three options for breakfast, lunch and dinner on each planned day. You choose the recipes before saving.</p><button onClick={generatePlan} disabled={loading || recommendationLoading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-bold text-white transition hover:opacity-90 disabled:opacity-60 sm:w-auto"><Sparkles className="h-5 w-5" />{loading ? "Preparing recipe options..." : "Find dinner ideas"}</button></div>
        </section>
        {previewReady && <section className="mt-6 rounded-2xl border border-green-100 bg-green-50/70 p-4 text-sm text-green-900"><div className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /><p>Recipe options are ready in your weekly calendar. Use “Change recipe” in a meal slot to compare options, then save your selected plan.</p></div><div className="mt-3 flex flex-wrap gap-2"><button onClick={() => {setPreviewReady(false);setDraftDays([]);}} className="rounded-xl border border-green-200 bg-white px-4 py-2 font-semibold text-gray-700">Start over</button><button onClick={saveSelectedPlan} disabled={loading} className="rounded-xl bg-primary px-4 py-2 font-bold text-white disabled:opacity-60">{loading ? "Saving..." : "Save selected plan"}</button></div></section>}
      </main>
    </div>
  );
}
function NavLink({ label, active, onClick }) { return <button onClick={onClick} className={`px-3 py-2 rounded-lg whitespace-nowrap transition ${active ? "bg-green-50 text-primary" : "text-gray-600 hover:bg-gray-50 hover:text-primary"}`}>{label}</button>; }
