import AppNavbar from "@/components/AppNavbar";
import PageHeroBanner from "@/components/PageHeroBanner";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Sparkles, Utensils, ShoppingBasket, X, RefreshCw, BookOpen, Check } from "lucide-react";

export default function MealPlanDetails() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/meal-plans/:id");
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [groceryLoading, setGroceryLoading] = useState(false);
  const [recipes, setRecipes] = useState([]);
  const [showRecipeSelector, setShowRecipeSelector] = useState(false);
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedMealType, setSelectedMealType] = useState("");
  const [activeMealEditor, setActiveMealEditor] = useState("");
  const [savingMealKey, setSavingMealKey] = useState("");
  const [nutritionLogs, setNutritionLogs] = useState([]);
  const [nutritionMeal, setNutritionMeal] = useState(null);
  const [nutritionSaving, setNutritionSaving] = useState(false);
  const [nutritionForm, setNutritionForm] = useState({ servings: "1", calories: "", protein: "", carbohydrates: "", fat: "" });

  useEffect(() => {
    fetchMealPlan();
    fetchRecipes();
  }, [params?.id]);

  const fetchMealPlan = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) { setLocation("/login"); return; }
      const response = await fetch(`http://localhost:5000/api/meal-plans/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.message || "Failed to load meal plan");
        setLocation("/my-meal-plans");
        return;
      }
      setPlan(data.mealPlan);
      fetchNutritionLogs(data.mealPlan._id);
      if (data.mealPlan?.meals?.length) {
        setSelectedDay(String(data.mealPlan.meals[0].day));
        setSelectedMealType("breakfast");
      }
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server.");
    } finally { setLoading(false); }
  };

  const fetchNutritionLogs = async (planId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/nutrition/plan/${planId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) setNutritionLogs(data.logs || []);
    } catch (error) {
      console.error("Nutrition completion status error:", error);
    }
  };

  const openNutritionEntry = (day, mealType) => {
    const mealName = day?.[mealType] || "";
    const recipe = findRecipe(mealName);
    const nutrition = recipe?.nutrition || {};
    const existing = nutritionLogs.find((log) => Number(log.dayNumber) === Number(day.day) && log.mealType === mealType);
    setNutritionForm({
      servings: String(existing?.servings || 1),
      calories: String(existing?.calories ?? nutrition.calories ?? ""),
      protein: String(existing?.protein ?? nutrition.protein ?? ""),
      carbohydrates: String(existing?.carbohydrates ?? nutrition.carbohydrates ?? ""),
      fat: String(existing?.fat ?? nutrition.fat ?? ""),
    });
    setNutritionMeal({ dayNumber: day.day, mealType, mealName });
  };

  const saveNutritionEntry = async (event) => {
    event.preventDefault();
    if (!nutritionMeal) return;
    setNutritionSaving(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/nutrition/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          mealPlanId: plan._id,
          dayNumber: nutritionMeal.dayNumber,
          mealType: nutritionMeal.mealType,
          mealName: nutritionMeal.mealName,
          dateKey: (() => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`; })(),
          ...Object.fromEntries(Object.entries(nutritionForm).map(([key, value]) => [key, Number(value)])),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not save nutrition entry.");
      await fetchNutritionLogs(plan._id);
      setNutritionMeal(null);
      alert("Meal added to your Nutrition Dashboard.");
    } catch (error) {
      alert(error.message);
    } finally {
      setNutritionSaving(false);
    }
  };

  const fetchRecipes = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/recipes");
      const data = await response.json();
      if (response.ok) setRecipes(data.recipes || []);
    } catch (error) { console.error("Recipe loading error:", error); }
  };

  const selectedDayPlan = useMemo(() => {
    if (!plan?.meals) return null;
    return plan.meals.find((day) => String(day.day) === String(selectedDay));
  }, [plan, selectedDay]);

  const selectedMealName = selectedDayPlan?.[selectedMealType] || "";

  const normalizeRecipeName = (value) => value
    ?.toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ");

  const findRecipe = (mealName) => {
    const normalizedMeal = normalizeRecipeName(mealName);
    if (!normalizedMeal) return null;
    return recipes.find((recipe) => normalizeRecipeName(recipe.name) === normalizedMeal);
  };

  const selectedRecipe = findRecipe(selectedMealName);

  // A generated plan starts on its creation date. Day 1 is editable on that
  // date; on later dates, only today and upcoming plan days remain editable.
  const getIsFutureOrTodayPlanDay = (dayNumber) => {
    if (plan?.isArchived || !plan?.createdAt) return false;
    const start = new Date(plan.createdAt);
    if (Number.isNaN(start.getTime())) return false;
    const today = new Date();
    const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const elapsedDays = Math.floor((todayDate - startDate) / 86400000);
    return Number(dayNumber) >= elapsedDays + 1;
  };

  const selectMealOption = async (day, mealType, option, recipeId = "") => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/meal-plans/${plan._id}/selection`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ day, mealType, option, recipeId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not save meal selection");
      setPlan(data.mealPlan);
    } catch (error) {
      console.error("Meal option selection error:", error);
      alert(error.message);
    }
  };

  const openOrGenerateRecipe = (dayPlan, mealType) => {
    const mealName = dayPlan?.[mealType] || "";
    if (!mealName) { alert("This meal is not available."); return; }
    const existing = findRecipe(mealName);
    if (existing) {
      setLocation(`/recipes/${existing._id}?return=meal-plan&planId=${plan._id}&day=${dayPlan.day}&mealType=${mealType}`);
      return;
    }
    setSelectedDay(String(dayPlan.day));
    setSelectedMealType(mealType);
    setShowRecipeSelector(true);
  };

  const generateRecipe = () => {
    if (!selectedMealName || !selectedDayPlan) { alert("Please select a day and meal first."); return; }
    // Use only the ingredients belonging to the selected meal, never the whole pantry/plan list.
    const selectedIngredients = selectedDayPlan[selectedMealType + "Ingredients"] || [];
    // Recipe generation needs ingredient names, not quantity hints such as "as needed".
    // Normalize prefixes and remove duplicates (including case-only duplicates).
    const ingredientNames = selectedIngredients
      .map((item) => {
        const rawName = typeof item === "string" ? item : item?.name;
        return String(rawName || "")
          .replace(/^\s*as\s+needed\s*[:,-]?\s*/i, "")
          .trim();
      })
      .filter(Boolean);
    const ingredientText = [...new Map(
      ingredientNames.map((name) => [name.toLowerCase(), name])
    ).values()].join(", ");
    if (!ingredientText) { alert("No ingredients were saved for this selected meal."); return; }
    const query = new URLSearchParams({
      generate: "1",
      meal: selectedMealName,
      ingredients: ingredientText,
      return: "meal-plan",
      planId: plan._id,
      day: selectedDayPlan.day,
      mealType: selectedMealType,
    });
    setLocation(`/recipes?${query.toString()}`);
  };

  const openExistingRecipe = () => {
    if (!selectedRecipe) return;
    setLocation(`/recipes/${selectedRecipe._id}?return=meal-plan&planId=${plan._id}&day=${selectedDayPlan.day}&mealType=${selectedMealType}`);
  };

  const generateGroceryList = async () => {
    try {
      setGroceryLoading(true);
      const token = localStorage.getItem("token");
      if (!token) { setLocation("/login"); return; }
      const response = await fetch("http://localhost:5000/api/user/grocery", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mealPlanId: plan._id }),
      });
      const data = await response.json();
      if (!response.ok) { alert(data.message || "Failed to create grocery list"); return; }
      if (data.groceryList?._id) setLocation(`/grocery-store?listId=${encodeURIComponent(data.groceryList._id)}`);
      else setLocation("/user/grocery");
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server.");
    } finally { setGroceryLoading(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#f7faf7]"><p className="text-gray-500">Loading meal plan...</p></div>;
  if (!plan) return null;

  return (
    <div className="min-h-screen bg-[#f7faf7]">
      <AppNavbar />
      <PageHeroBanner title="Your Meal Plan" description="Your personalized meals, organized day by day." eyebrow="AI MEAL PLAN" icon={Utensils} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-500"><button onClick={() => setLocation("/my-meal-plans")} className="hover:text-primary transition">Meal Plans</button><span>/</span><span className="text-gray-900 font-semibold">{plan.duration}-Day Plan</span></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <InfoCard title="Goal" value={plan.goal} /><InfoCard title="Diet" value={plan.diet} /><InfoCard title="Duration" value={`${plan.duration} Days`} />
        </div>

        <section className="space-y-6">
          {plan.meals.map((day) => <div key={day.day} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6"><div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center"><Utensils className="w-5 h-5 text-primary" /></div><h2 className="text-xl font-black text-gray-900">Day {day.day}</h2></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {["breakfast", "lunch", "dinner"].map((type) => {
                const mealKey = `${day.day}-${type}`;
                const options = Array.isArray(day[type + "Options"]) ? day[type + "Options"] : [];
                const matchingRecipes = recipes.filter((recipe) => String(recipe.category || "").toLowerCase() === type || !recipe.category || String(recipe.category).toLowerCase() === "other");
                return <div key={type} className="border border-gray-100 rounded-2xl p-5">
                  <p className="text-xs uppercase tracking-wide font-bold text-primary">{type}</p>
                  <p className="font-bold text-gray-900 mt-2">{day[type] || "Meal not available"}</p>
                  {nutritionLogs.some((log) => Number(log.dayNumber) === Number(day.day) && log.mealType === type) && <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-bold text-green-700"><Check className="h-3 w-3" /> Eaten · nutrition logged</p>}
                  <div className="flex flex-wrap gap-2 mt-4">
                    <button type="button" onClick={() => openNutritionEntry(day, type)} className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-bold text-primary hover:bg-green-100"><Check className="w-3.5 h-3.5"/>{nutritionLogs.some((log) => Number(log.dayNumber) === Number(day.day) && log.mealType === type) ? "Update nutrition" : "Mark as eaten"}</button>
                    {getIsFutureOrTodayPlanDay(day.day) && <button type="button" onClick={() => setActiveMealEditor(activeMealEditor === mealKey ? "" : mealKey)} className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 px-3 py-2 text-xs font-bold text-primary hover:bg-green-50"><RefreshCw className="w-3.5 h-3.5"/> Change meal</button>}
                    <button type="button" onClick={() => openOrGenerateRecipe(day, type)} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:border-primary hover:text-primary"><BookOpen className="w-3.5 h-3.5"/> Generate recipe</button>
                  </div>
                  {getIsFutureOrTodayPlanDay(day.day) && activeMealEditor === mealKey && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setActiveMealEditor(""); }}>
                    <section role="dialog" aria-modal="true" aria-labelledby={`change-meal-title-${mealKey}`} className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                      <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
                        <div><p className="text-xs font-bold uppercase tracking-wide text-primary">Day {day.day} · {type}</p><h2 id={`change-meal-title-${mealKey}`} className="mt-1 text-xl font-black text-gray-900">Choose an alternative meal</h2><p className="mt-1 text-xs text-gray-500">Only this meal will change. Your other meals will stay the same.</p></div>
                        <button type="button" onClick={() => setActiveMealEditor("")} aria-label="Close alternatives" className="rounded-lg px-2 py-1 text-2xl leading-none text-gray-400 hover:bg-gray-100">×</button>
                      </div>
                      <div className="overflow-y-auto p-5 space-y-3">
                        <p className="text-sm font-bold text-gray-800">AI meal alternatives</p>
                        {options.filter((option) => option.name !== day[type]).map((option) => <button key={option.name} type="button" disabled={savingMealKey === mealKey} onClick={async () => { setSavingMealKey(mealKey); await selectMealOption(day.day, type, option); setSavingMealKey(""); setActiveMealEditor(""); }} className="w-full rounded-xl border border-gray-200 p-3 text-left hover:border-primary hover:bg-green-50/40 disabled:opacity-50">
                          <span className="block text-sm font-bold text-gray-900">{option.name}</span><span className="mt-1 block text-xs text-gray-500">{option.prepTime ? `Time: ${option.prepTime}` : "Preparation time not available"}</span>
                        </button>)}
                        {!options.filter((option) => option.name !== day[type]).length && <p className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500">No AI alternatives are available for this meal.</p>}
                        <div className="border-t border-gray-100 pt-4">
                          <p className="mb-3 text-sm font-bold text-gray-800">Choose from MealMate recipes</p>
                          <div className="space-y-2">
                            {matchingRecipes.slice(0, 12).map((recipe) => <button key={recipe._id} type="button" disabled={savingMealKey === mealKey} onClick={async () => { setSavingMealKey(mealKey); await selectMealOption(day.day, type, null, recipe._id); setSavingMealKey(""); setActiveMealEditor(""); }} className="w-full flex items-center justify-between gap-3 rounded-xl border border-gray-200 p-3 text-left hover:border-primary hover:bg-green-50/40 disabled:opacity-50">
                              <span className="min-w-0"><span className="block text-sm font-bold text-gray-900 truncate">{recipe.name}</span><span className="block text-xs text-gray-500">{recipe.prepTime || "Prep time not specified"}</span></span><Check className="w-4 h-4 text-primary shrink-0"/>
                            </button>)}
                            {!matchingRecipes.length && <p className="text-xs text-gray-400">No matching recipes available yet.</p>}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end border-t border-gray-100 px-5 py-4"><button type="button" onClick={() => setActiveMealEditor("")} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button></div>
                    </section>
                  </div>}
                </div>;
              })}
            </div>
          </div>)}
        </section>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mt-8">
          <button onClick={() => setShowRecipeSelector(true)} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold hover:opacity-90 transition"><Sparkles className="w-5 h-5" />Generate Recipe</button>
          <button onClick={generateGroceryList} disabled={groceryLoading} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold hover:border-primary hover:text-primary transition disabled:opacity-50 disabled:cursor-not-allowed"><ShoppingBasket className="w-5 h-5" />{groceryLoading ? "Preparing Cart..." : "Open Grocery Cart"}</button>
        </div>

        {nutritionMeal && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !nutritionSaving) setNutritionMeal(null); }}>
          <form onSubmit={saveNutritionEntry} className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-primary">Nutrition tracking</p><h2 className="mt-1 text-xl font-black text-gray-900">Did you eat {nutritionMeal.mealName}?</h2><p className="mt-1 text-xs text-gray-500">Enter nutrition per serving. Values from a saved recipe are prefilled when available.</p></div><button type="button" onClick={() => setNutritionMeal(null)} disabled={nutritionSaving} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100" aria-label="Close"><X className="h-5 w-5"/></button></div>
            <div className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">MealMate does not estimate missing nutrition values. Use a trusted nutrition source or the food label for accurate tracking.</div>
            <div className="grid grid-cols-2 gap-3">
              {[["servings","Servings","0.25"],["calories","Calories (kcal)","0"],["protein","Protein (g)","0"],["carbohydrates","Carbohydrates (g)","0"],["fat","Fat (g)","0"]].map(([key,label,min]) => <label key={key} className={`text-xs font-semibold text-gray-600 ${key === "servings" ? "col-span-2" : ""}`}>{label}<input type="number" min={min} max={key === "calories" ? "20000" : key === "servings" ? "20" : "2000"} step="0.1" required value={nutritionForm[key]} onChange={(event) => setNutritionForm((current) => ({ ...current, [key]: event.target.value }))} className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-primary"/></label>)}
            </div>
            <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setNutritionMeal(null)} disabled={nutritionSaving} className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600">Cancel</button><button disabled={nutritionSaving} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{nutritionSaving ? "Saving..." : "Save to Nutrition Dashboard"}</button></div>
          </form>
        </div>}

        {showRecipeSelector && <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowRecipeSelector(false); }}>
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-5">
            <div className="flex items-center justify-between mb-5"><div><h2 className="text-lg font-black text-gray-900">Recipe for a Meal</h2><p className="text-xs text-gray-500 mt-1">Choose a day and meal.</p></div><button onClick={() => setShowRecipeSelector(false)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-50" aria-label="Close"><X className="w-5 h-5" /></button></div>
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">Day<select value={selectedDay} onChange={(event) => setSelectedDay(event.target.value)} className="mt-1.5 w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white outline-none focus:border-primary">{plan.meals.map((day) => <option key={day.day} value={day.day}>Day {day.day}</option>)}</select></label>
              <label className="block text-sm font-semibold text-gray-700">Meal<select value={selectedMealType} onChange={(event) => setSelectedMealType(event.target.value)} className="mt-1.5 w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white outline-none focus:border-primary"><option value="breakfast">Breakfast — {selectedDayPlan?.breakfast || "Not available"}</option><option value="lunch">Lunch — {selectedDayPlan?.lunch || "Not available"}</option><option value="dinner">Dinner — {selectedDayPlan?.dinner || "Not available"}</option></select></label>
              <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2.5"><p className="text-[11px] uppercase tracking-wide font-bold text-primary">Selected meal</p><p className="text-sm font-bold text-gray-900 mt-0.5 truncate">{selectedMealName || "Select a meal"}</p></div>
              {selectedRecipe ? <div className="rounded-lg border border-green-100 bg-green-50/60 px-3 py-3"><p className="text-xs font-semibold text-primary">Recipe already generated for this meal</p><button onClick={openExistingRecipe} className="w-full mt-2 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 transition">Open Saved Recipe</button></div> : <button onClick={generateRecipe} disabled={!selectedMealName} className="w-full py-2.5 rounded-lg bg-primary text-white text-sm font-bold hover:opacity-90 transition disabled:opacity-50">Generate Recipe</button>}
            </div>
          </div>
        </div>}

        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mt-8"><Sparkles className="w-4 h-4 text-primary" />Meal plan generated by MealMate AI</div>
      </main>
    </div>
  );
}

function NavLink({ label, active, onClick }) { return <button onClick={onClick} className={`px-3 py-2 rounded-lg whitespace-nowrap transition ${active ? "bg-green-50 text-primary" : "text-gray-600 hover:bg-gray-50 hover:text-primary"}`}>{label}</button>; }
function InfoCard({ title, value }) { return <div className="bg-white rounded-2xl border border-gray-100 p-5"><p className="text-sm text-gray-500">{title}</p><p className="text-lg font-bold text-gray-900 capitalize mt-1">{value}</p></div>; }
function MealCard({ title, meal, options = [], groupName, onSelect }) {
  return <div className="border border-gray-100 rounded-2xl p-5">
    <p className="text-xs uppercase tracking-wide font-bold text-primary">{title}</p>
    {options.length > 0 ? <div className="mt-3 space-y-3">{options.slice(0, 3).map((option, index) => <label key={option.name || index} className={`flex gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${meal === option.name ? "border-primary bg-green-50" : "border-gray-100 hover:border-green-200"}`}>
      <input type="radio" name={groupName} checked={meal === option.name} onChange={() => onSelect?.(option)} className="mt-1 accent-green-700" />
      <span className="min-w-0"><span className="block text-sm font-bold text-gray-900">{option.name}</span>{option.description && <span className="block text-xs text-gray-500 mt-1">{option.description}</span>}{option.prepTime && <span className="block text-[11px] text-primary mt-1">{option.prepTime}</span>}</span>
    </label>)}</div> : <p className="font-bold text-gray-900 mt-2">{meal || "Meal not available"}</p>}
  </div>;
}
