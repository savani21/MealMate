import AppNavbar from "@/components/AppNavbar";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Sparkles, Target, ShoppingBasket, ThumbsUp, CheckCircle2, ChefHat, ChevronDown, Star, ArrowDown, Plus } from "lucide-react";

const API = "http://localhost:5000/api/meal-plans";

export default function MealPlanner() {
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const [goal, setGoal] = useState("");
  const [diet, setDiet] = useState("");
  const [ingredients, setIngredients] = useState(params.get("ingredients") || "");
  const [pantryItems, setPantryItems] = useState([]);
  const [selectedPantryNames, setSelectedPantryNames] = useState([]);
  const [pantryLoading, setPantryLoading] = useState(true);
  const [newIngredient, setNewIngredient] = useState("");
  const [newIngredientQuantity, setNewIngredientQuantity] = useState("1");
  const [newIngredientUnit, setNewIngredientUnit] = useState("g");
  const [addingIngredient, setAddingIngredient] = useState(false);
  const [ingredientMessage, setIngredientMessage] = useState("");
  const [showIngredientPicker, setShowIngredientPicker] = useState(false);
  const [duration, setDuration] = useState("3");
  const [ingredientMode, setIngredientMode] = useState(params.get("mode") || "available");
  const [recommendedIngredients, setRecommendedIngredients] = useState(params.get("recommended") ? params.get("recommended").split(",").filter(Boolean) : []);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [draftDays, setDraftDays] = useState([]);
  const [previewReady, setPreviewReady] = useState(false);
  const [recipeDetails, setRecipeDetails] = useState(null);
  const recipeChoicesRef = useRef(null);
  const planningMethodRef = useRef(null);
  const recommendedRecipesRef = useRef(null);
  const generateButtonRef = useRef(null);
  const savePlanRef = useRef(null);
  const scrollTo = (ref) => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setPantryLoading(false); return; }
    fetch("http://localhost:5000/api/user/pantry", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Unable to load pantry items");
        const items = Array.isArray(data.items) ? data.items : [];
        setPantryItems(items);
        setSelectedPantryNames(items.map((item) => item.name).filter(Boolean));
      })
      .catch((error) => console.error("Pantry loading error:", error))
      .finally(() => setPantryLoading(false));
  }, []);

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

  const getAvailableIngredients = () => [...new Set([...selectedPantryNames, ...ingredients.split(",").map((item) => item.trim()).filter(Boolean)])];

  const addCustomIngredient = async () => {
    const name = newIngredient.trim().replace(/,+$/, "");
    const quantity = Number(newIngredientQuantity);
    const unit = newIngredientUnit.trim().toLowerCase();
    if (!name) {
      setIngredientMessage("Enter an ingredient name.");
      return;
    }
    if (!Number.isFinite(quantity) || quantity <= 0 || !unit) {
      setIngredientMessage("Enter a quantity greater than zero and select a unit.");
      return;
    }

    const existingItem = pantryItems.find((item) => String(item.name || "").trim().toLowerCase() === name.toLowerCase());
    if (existingItem) {
      setSelectedPantryNames((current) => current.some((item) => item.toLowerCase() === existingItem.name.toLowerCase()) ? current : [...current, existingItem.name]);
      setIngredientMessage(`${existingItem.name} is already in your pantry and has been selected.`);
      setNewIngredient("");
      setPreviewReady(false);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setIngredientMessage("Please log in before adding ingredients to your pantry.");
      setLocation("/login");
      return;
    }

    setAddingIngredient(true);
    setIngredientMessage("");
    try {
      const response = await fetch("http://localhost:5000/api/user/pantry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, quantity, unit }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to save ingredient to your pantry.");

      const savedItem = data.item;
      if (!savedItem?.name) throw new Error("The pantry saved the ingredient but returned no ingredient details. Refresh your pantry and try again.");

      setPantryItems((current) => {
        const exists = current.some((item) => String(item.name || "").toLowerCase() === savedItem.name.toLowerCase());
        return exists ? current.map((item) => item.name.toLowerCase() === savedItem.name.toLowerCase() ? savedItem : item) : [...current, savedItem].sort((a, b) => a.name.localeCompare(b.name));
      });
      setSelectedPantryNames((current) => current.some((item) => item.toLowerCase() === savedItem.name.toLowerCase()) ? current : [...current, savedItem.name]);
      setNewIngredient("");
      setNewIngredientQuantity("1");
      setNewIngredientUnit("g");
      setPreviewReady(false);
      setIngredientMessage(`${savedItem.name} was saved to your pantry and selected for this meal plan.`);
    } catch (error) {
      console.error("Add pantry ingredient error:", error);
      setIngredientMessage(error.message || "Unable to add ingredient. Please try again.");
    } finally {
      setAddingIngredient(false);
    }
  };

  const togglePantryIngredient = (name) => {
    setSelectedPantryNames((current) => current.some((item) => item.toLowerCase() === name.toLowerCase()) ? current.filter((item) => item.toLowerCase() !== name.toLowerCase()) : [...current, name]);
    setPreviewReady(false);
  };

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
    if (pantryItems.length === 0) { alert("Please add ingredients to My Kitchen → Pantry first, then select the items you want to use."); return; }
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
    if (dayIndex === draftDays.length - 1 && mealType === "dinner") {
      setTimeout(() => scrollTo(savePlanRef), 120);
    }
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
  const [showRecommendedRecipes, setShowRecommendedRecipes] = useState(false);

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
    return () => clearTimeout(timer);
  }, [ingredients, selectedPantryNames.join(","), diet, ingredientMode, recommendedIngredients.join(",")]);


  return (
    <div className="min-h-screen bg-[#f7faf7]">
      <AppNavbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#173f2b] via-[#23633f] to-[#367c4e] px-6 py-9 text-white shadow-md sm:px-10 sm:py-12">
            <div className="relative z-10 flex items-center justify-between gap-4">
              <div className="min-w-0 max-w-2xl">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold tracking-wide text-green-50">
                  <Sparkles className="h-4 w-4" /> MEALMATE SMART MEAL PLANNER
                </div>
                <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Plan smarter. Eat better.</h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-green-50/90 sm:text-base">
                  Create a meal plan around your goals, diet and available ingredients. Explore recipe ideas and choose the meals you love.
                </p>
              </div>
              <button
                type="button"
                onClick={() => document.getElementById("meal-plan-preferences")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-green-900 transition hover:bg-green-50"
              >
                <Target className="h-4 w-4" /> Plan my meals
              </button>
            </div>
            <ChefHat className="absolute -bottom-10 -right-5 h-56 w-56 rotate-[-12deg] text-white/[0.08] sm:right-10 sm:h-72 sm:w-72" />
          </section>
        </div>
                <section id="meal-plan-preferences" className="scroll-mt-24 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50"><Target className="h-5 w-5 text-primary" /></div>
            <h2 className="text-lg font-black text-gray-900">Meal Plan Preferences</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Goal</label>
              <select value={goal} onChange={(e) => {setGoal(e.target.value);setPreviewReady(false);}} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-green-100">
                <option value="">Select your goal</option><option value="weight-loss">Weight Loss</option><option value="weight-gain">Weight Gain</option><option value="muscle-gain">Muscle Gain</option><option value="healthy-eating">Healthy Eating</option><option value="maintenance">Maintain Weight</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Diet Type</label>
              <select value={diet} onChange={(e) => {handleDietChange(e.target.value);setPreviewReady(false);setShowRecommendedRecipes(false);}} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-green-100">
                <option value="">Select diet type</option><option value="vegetarian">Vegetarian</option><option value="vegan">Vegan</option><option value="non-vegetarian">Non-Vegetarian</option><option value="eggetarian">Eggetarian</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Plan Duration</label>
              <select value={duration} onChange={(e) => {setDuration(e.target.value);setPreviewReady(false);}} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-green-100">
                <option value="1">1 Day</option><option value="3">3 Days</option><option value="7">7 Days</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Available Ingredients</label>
              <p className="mb-3 text-xs text-gray-500">Select ingredients available in your pantry or add other ingredients.</p>
              <button type="button" onClick={() => setShowIngredientPicker(true)} className="flex w-full items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left transition hover:border-green-300 hover:bg-green-50/40">
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-gray-800">{getAvailableIngredients().length ? getAvailableIngredients().join(", ") : "No ingredients selected yet"}</span>
                  <span className="mt-0.5 block text-xs text-gray-500">{getAvailableIngredients().length ? `${getAvailableIngredients().length} ingredients selected` : "Choose items you want to use for this meal plan"}</span>
                </span>
                <span className="shrink-0 rounded-lg bg-green-50 px-3 py-2 text-sm font-semibold text-primary">Select ingredients</span>
              </button>
              
              {pantryItems.length === 0 && !pantryLoading && <p className="mt-2 rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800">Your pantry is empty. Add ingredients in My Kitchen → Pantry before planning meals.</p>}
            </div>
            <div className="md:col-span-2">
              <label htmlFor="ingredient-mode" className="mb-1.5 block text-sm font-semibold text-gray-700">Ingredient Preference</label>
              <select id="ingredient-mode" value={ingredientMode} onChange={async (e) => {
                const mode = e.target.value;
                setIngredientMode(mode);
                setPreviewReady(false);
                if (mode === "recommended") await getRecommendedIngredients();
              }} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-green-100">
                <option value="available">Only Available Ingredients</option>
                <option value="recommended">Available + Recommended Ingredients</option>
              </select>
            </div>
          </div>
          <section className="mt-4">
            <div className="rounded-2xl border border-green-100 bg-green-50/50 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowRecommendedRecipes((open) => !open)}
                aria-expanded={showRecommendedRecipes}
                className="w-full flex items-center justify-between gap-3 p-3 text-left hover:bg-green-50 transition"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 text-sm">Recommended Recipes</h3>
                    <span className="rounded-full bg-white border border-green-100 px-2 py-0.5 text-[11px] font-bold text-primary">
                      {recommendedRecipes.length} found
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Best matches for your ingredients and diet, ranked by rating.</p>
                </div>
                <ChevronDown className={`w-5 h-5 shrink-0 text-primary transition-transform ${showRecommendedRecipes ? "rotate-180" : ""}`} />
              </button>
              {showRecommendedRecipes && (
                <div className="border-t border-green-100 bg-white p-3">
                  {recommendationLoading ? (
                    <p className="text-sm text-gray-500">Finding the best-rated recipes for you...</p>
                  ) : recommendedRecipes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {recommendedRecipes.slice(0, 3).map((recipe) => (
                        <div key={recipe._id} className="rounded-lg border border-gray-100 p-3 bg-gray-50">
                          <h4 className="font-semibold text-sm text-gray-900">{recipe.name}</h4>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{recipe.description}</p>
                          <div className="flex flex-wrap gap-2 mt-3 text-xs">
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 px-2 py-1 font-semibold">
                              <Star className="w-3.5 h-3.5 fill-current" /> {(Number(recipe.averageRating) || 0).toFixed(1)}/5
                            </span>
                            <span className="rounded-full bg-white px-2 py-1 text-gray-600">{recipe.ratingCount || 0} ratings</span>
                            <span className="rounded-full bg-white px-2 py-1 text-gray-600">{recipe.matchPercentage || 0}% ingredient match</span>
                          </div>
                          {recipe.missingIngredients?.length > 0 && <p className="text-xs text-amber-700 mt-2">Missing: {recipe.missingIngredients.join(", ")}</p>}
                          <button type="button" onClick={() => setLocation(`/recipes/${recipe._id}`)} className="mt-3 text-sm font-semibold text-primary hover:underline">View recipe</button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Add ingredients and select a food preference to see recipe suggestions.</p>
                  )}
                </div>
              )}
            </div>
          </section>
          <div className="mt-4" ref={generateButtonRef}><div className="text-center text-xs text-gray-500 mb-2">Next step: generate your meal options</div><button onClick={generatePlan} disabled={loading || recommendationLoading} className="w-full md:w-auto md:min-w-[280px] mx-auto flex items-center justify-center gap-2 bg-primary text-white px-6 py-3.5 rounded-xl font-bold hover:opacity-90 transition disabled:opacity-60"><Sparkles className="w-5 h-5" />{loading ? "Preparing Recipe Options..." : "Show My Recipe Options"}</button></div>
        </section>

        {showIngredientPicker && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowIngredientPicker(false); }}>
            <section role="dialog" aria-modal="true" aria-labelledby="ingredient-picker-title" className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4">
                <div>
                  <h2 id="ingredient-picker-title" className="text-lg font-bold text-gray-900">Ingredients you want to use for meal</h2>
                  <p className="mt-1 text-sm text-gray-500">Select ingredients from your pantry for this meal plan.</p>
                </div>
                <button type="button" onClick={() => setShowIngredientPicker(false)} aria-label="Close ingredient selection" className="rounded-lg px-2 py-1 text-xl text-gray-400 hover:bg-gray-100">×</button>
              </div>
              <div className="overflow-y-auto p-5">
                {pantryLoading ? <p className="text-sm text-gray-500">Loading your pantry...</p> : pantryItems.length ? (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {pantryItems.map((item) => <label key={item._id || item.name} className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-3 text-sm text-gray-700 hover:border-green-200">
                      <input type="checkbox" checked={selectedPantryNames.some((name) => name.toLowerCase() === item.name.toLowerCase())} onChange={() => togglePantryIngredient(item.name)} className="h-4 w-4 accent-green-700" />
                      <span className="min-w-0 flex-1 capitalize">{item.name}</span>
                      <span className="shrink-0 text-xs text-gray-400">{item.quantity} {item.unit}</span>
                    </label>)}
                  </div>
                ) : <p className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800">Your pantry is empty. You can still add ingredients below, or add pantry items in My Kitchen → Pantry.</p>}
                <div className="mt-5">
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Add another ingredient to your pantry and this meal plan</label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_90px_110px_auto]">
                    <input value={newIngredient} onChange={(event) => { setNewIngredient(event.target.value); setIngredientMessage(""); }} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addCustomIngredient(); } }} placeholder="e.g. fresh coriander" className="min-w-0 rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:border-primary" />
                    <input type="number" min="0.01" step="any" value={newIngredientQuantity} onChange={(event) => setNewIngredientQuantity(event.target.value)} aria-label="Ingredient quantity" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 outline-none focus:border-primary" />
                    <select value={newIngredientUnit} onChange={(event) => setNewIngredientUnit(event.target.value)} aria-label="Ingredient unit" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 outline-none focus:border-primary">
                      {["g", "kg", "ml", "l", "piece", "pieces", "bunch", "pack"].map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                    </select>
                    <button type="button" onClick={addCustomIngredient} disabled={addingIngredient} className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-200 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"><Plus className="h-4 w-4" /> {addingIngredient ? "Saving..." : "Add ingredient"}</button>
                  </div>
                  {ingredientMessage && <p role="status" className="mt-2 text-xs text-gray-600">{ingredientMessage}</p>}
                  <p className="mt-2 text-xs text-gray-500">New ingredients are saved to your pantry and automatically selected for this meal plan.</p>
                  {ingredients.split(",").map((item) => item.trim()).filter(Boolean).length > 0 && <p className="mt-2 text-xs text-gray-500">Additional ingredients: {ingredients.split(",").map((item) => item.trim()).filter(Boolean).join(", ")}</p>}
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-5 py-4">
                <span className="text-sm text-gray-500">{getAvailableIngredients().length} selected</span>
                <button type="button" onClick={() => setShowIngredientPicker(false)} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90">Done</button>
              </div>
            </section>
          </div>
        )}
        {recipeDetails && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setRecipeDetails(null); }}>
            <section role="dialog" aria-modal="true" aria-labelledby="recipe-details-title" className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-primary">{recipeDetails.mealType} · Day {recipeDetails.day}</p>
                  <h2 id="recipe-details-title" className="mt-1 text-xl font-black text-gray-900">{recipeDetails.name}</h2>
                  <p className="mt-1 text-sm font-semibold text-primary">{recipeDetails.prepTime ? `Preparation time: ${recipeDetails.prepTime}` : "Preparation time not available"}</p>
                </div>
                <button type="button" onClick={() => setRecipeDetails(null)} aria-label="Close recipe details" className="rounded-lg px-2 py-1 text-2xl leading-none text-gray-400 hover:bg-gray-100">×</button>
              </div>
              <div className="overflow-y-auto p-5">
                <h3 className="mb-3 text-sm font-bold text-gray-900">Ingredients required</h3>
                {Array.isArray(recipeDetails.ingredients) && recipeDetails.ingredients.length > 0 ? (
                  <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {recipeDetails.ingredients.map((item, index) => {
                      const name = typeof item === "string" ? item : item.name;
                      const quantity = typeof item === "string" ? "" : item.quantity;
                      return <li key={name + index} className="flex items-start justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm"><span className="text-gray-700">{name}</span>{quantity && <span className="shrink-0 text-xs font-medium text-gray-500">{quantity}</span>}</li>;
                    })}
                  </ul>
                ) : <p className="text-sm text-gray-500">Ingredient details are not available for this recipe yet.</p>}
              </div>
              <div className="flex justify-end border-t border-gray-100 px-5 py-4">
                <button type="button" onClick={() => setRecipeDetails(null)} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90">Done</button>
              </div>
            </section>
          </div>
        )}
        {previewReady && <section ref={recipeChoicesRef} className="mt-10 space-y-6 scroll-mt-24">
          <div className="text-center"><div className="inline-flex items-center gap-2 text-primary text-sm font-semibold"><CheckCircle2 className="w-4 h-4"/> Your preferences are applied</div><h2 className="text-2xl font-black text-gray-900 mt-2">Choose Your Recipes</h2><p className="text-sm text-gray-500 mt-2">Select one recipe for breakfast, lunch and dinner. Your chosen ingredients are already included.</p></div>
          {draftDays.map((day, dayIndex) => <div key={day.day || dayIndex} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-7"><div className="flex items-center gap-2 mb-5"><div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center"><ChefHat className="w-5 h-5 text-primary"/></div><h3 className="text-lg font-black text-gray-900">Day {day.day || dayIndex + 1}</h3></div><div className="grid grid-cols-1 lg:grid-cols-3 gap-5">{["breakfast","lunch","dinner"].map((type) => <div key={type} className="rounded-2xl border border-gray-100 p-4"><div className="text-xs font-bold uppercase tracking-wide text-primary mb-3">{type}</div><div className="space-y-2">{(day[type + "Options"] || []).map((option, optionIndex) => <button type="button" key={option.name + optionIndex} onClick={() => { selectOption(dayIndex, type, option); setRecipeDetails({ ...option, mealType: type, day: day.day || dayIndex + 1 }); }} className={`block w-full rounded-xl border p-3 text-left transition ${day[type] === option.name ? "border-primary bg-green-50" : "border-gray-100 hover:border-green-200"}`}><span className="flex items-start gap-2.5"><input type="radio" tabIndex={-1} aria-label={`Select ${option.name}`} name={`day-${dayIndex}-${type}`} checked={day[type] === option.name} onChange={() => selectOption(dayIndex, type, option)} className="mt-1 accent-green-700 pointer-events-none"/><span className="min-w-0"><span className="block font-bold text-sm text-gray-900">{option.name}</span><span className="mt-1 block text-xs font-medium text-primary">{option.prepTime ? `Time: ${option.prepTime}` : "Preparation time not available"}</span><span className="mt-1 block text-[11px] text-gray-400">Click to view recipe details</span></span></span></button>)}</div>{(day[type + "Options"] || []).length === 0 && <p className="text-sm text-red-500">No options returned for this meal. Please regenerate.</p>}</div>)}</div></div>)}
          <div ref={savePlanRef} className="flex flex-col sm:flex-row justify-center gap-3 scroll-mt-24"><button onClick={() => {setPreviewReady(false);setDraftDays([]);}} className="px-6 py-3 rounded-xl border border-gray-200 font-semibold text-gray-600">Change Preferences</button><button onClick={saveSelectedPlan} disabled={loading} className="px-7 py-3 rounded-xl bg-primary text-white font-bold disabled:opacity-60">{loading ? "Saving Your Choices..." : "Save Selected Meal Plan"}</button></div>
        </section>}
      </main>
    </div>
  );
}
function NavLink({ label, active, onClick }) { return <button onClick={onClick} className={`px-3 py-2 rounded-lg whitespace-nowrap transition ${active ? "bg-green-50 text-primary" : "text-gray-600 hover:bg-gray-50 hover:text-primary"}`}>{label}</button>; }
