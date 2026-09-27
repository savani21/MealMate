import { useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Sparkles, Utensils, ShoppingBasket, X } from "lucide-react";

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
      if (data.mealPlan?.meals?.length) {
        setSelectedDay(String(data.mealPlan.meals[0].day));
        setSelectedMealType("breakfast");
      }
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server.");
    } finally { setLoading(false); }
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

  const generateRecipe = () => {
    if (!selectedMealName) { alert("Please select a day and meal first."); return; }
    const query = new URLSearchParams({
      generate: "1",
      meal: selectedMealName,
      ingredients: plan.ingredients || "",
      return: "meal-plan",
      planId: plan._id,
    });
    setLocation(`/recipes?${query.toString()}`);
  };

  const openExistingRecipe = () => {
    if (!selectedRecipe) return;
    setLocation(`/recipes/${selectedRecipe._id}?return=meal-plan&planId=${plan._id}`);
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
      alert("Grocery list created successfully!");
      setLocation("/user/grocery");
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server.");
    } finally { setGroceryLoading(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#f7faf7]"><p className="text-gray-500">Loading meal plan...</p></div>;
  if (!plan) return null;

  return (
    <div className="min-h-screen bg-[#f7faf7]">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="h-20 flex items-center justify-between gap-6">
            <div className="flex items-center gap-2 shrink-0"><Sparkles className="w-6 h-6 text-primary" /><span className="text-xl font-black text-gray-900">Meal<span className="text-primary">Mate</span></span></div>
            <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto text-sm font-semibold">
              <NavLink label="Dashboard" onClick={() => setLocation("/dashboard")} />
              <NavLink label="Meal Plans" active onClick={() => setLocation("/my-meal-plans")} />
              <NavLink label="Recipes" onClick={() => setLocation("/recipes")} />
              <NavLink label="Favorites" onClick={() => setLocation("/favorites")} />
              <NavLink label="Notifications" onClick={() => setLocation("/notifications")} />
              <NavLink label="Profile" onClick={() => setLocation("/profile")} />
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-500"><button onClick={() => setLocation("/my-meal-plans")} className="hover:text-primary transition">Meal Plans</button><span>/</span><span className="text-gray-900 font-semibold">{plan.duration}-Day Plan</span></div>
        <section className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-primary text-sm font-semibold"><Sparkles className="w-4 h-4" /> AI Generated Plan</div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mt-4">Your {plan.duration}-Day Meal Plan</h1>
          <p className="text-gray-500 mt-3">Personalized according to your goals, diet, and selected ingredients.</p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <InfoCard title="Goal" value={plan.goal} /><InfoCard title="Diet" value={plan.diet} /><InfoCard title="Duration" value={`${plan.duration} Days`} />
        </div>

        <section className="space-y-6">
          {plan.meals.map((day) => <div key={day.day} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6"><div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center"><Utensils className="w-5 h-5 text-primary" /></div><h2 className="text-xl font-black text-gray-900">Day {day.day}</h2></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MealCard title="Breakfast" meal={day.breakfast} /><MealCard title="Lunch" meal={day.lunch} /><MealCard title="Snack" meal={day.snack} /><MealCard title="Dinner" meal={day.dinner} />
            </div>
          </div>)}
        </section>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mt-8">
          <button onClick={() => setShowRecipeSelector(true)} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold hover:opacity-90 transition"><Sparkles className="w-5 h-5" />Generate Recipe</button>
          <button onClick={generateGroceryList} disabled={groceryLoading} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold hover:border-primary hover:text-primary transition disabled:opacity-50 disabled:cursor-not-allowed"><ShoppingBasket className="w-5 h-5" />{groceryLoading ? "Creating Grocery List..." : "Generate Grocery List"}</button>
        </div>

        {showRecipeSelector && <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowRecipeSelector(false); }}>
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-5">
            <div className="flex items-center justify-between mb-5"><div><h2 className="text-lg font-black text-gray-900">Recipe for a Meal</h2><p className="text-xs text-gray-500 mt-1">Choose a day and meal.</p></div><button onClick={() => setShowRecipeSelector(false)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-50" aria-label="Close"><X className="w-5 h-5" /></button></div>
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">Day<select value={selectedDay} onChange={(event) => setSelectedDay(event.target.value)} className="mt-1.5 w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white outline-none focus:border-primary">{plan.meals.map((day) => <option key={day.day} value={day.day}>Day {day.day}</option>)}</select></label>
              <label className="block text-sm font-semibold text-gray-700">Meal<select value={selectedMealType} onChange={(event) => setSelectedMealType(event.target.value)} className="mt-1.5 w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white outline-none focus:border-primary"><option value="breakfast">Breakfast — {selectedDayPlan?.breakfast || "Not available"}</option><option value="lunch">Lunch — {selectedDayPlan?.lunch || "Not available"}</option><option value="snack">Snack — {selectedDayPlan?.snack || "Not available"}</option><option value="dinner">Dinner — {selectedDayPlan?.dinner || "Not available"}</option></select></label>
              <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2.5"><p className="text-[11px] uppercase tracking-wide font-bold text-primary">Selected meal</p><p className="text-sm font-bold text-gray-900 mt-0.5 truncate">{selectedMealName || "Select a meal"}</p></div>
              {selectedRecipe ? <div className="rounded-lg border border-green-100 bg-green-50/60 px-3 py-3"><p className="text-xs font-semibold text-primary">Existing recipe available</p><div className="flex gap-2 mt-2"><button onClick={openExistingRecipe} className="flex-1 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm font-semibold hover:border-primary hover:text-primary transition">View Recipe</button><button onClick={generateRecipe} className="flex-1 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 transition">Generate New</button></div></div> : <button onClick={generateRecipe} disabled={!selectedMealName} className="w-full py-2.5 rounded-lg bg-primary text-white text-sm font-bold hover:opacity-90 transition disabled:opacity-50">Generate Recipe</button>}
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
function MealCard({ title, meal }) { return <div className="border border-gray-100 rounded-2xl p-5"><p className="text-xs uppercase tracking-wide font-bold text-primary">{title}</p><p className="font-bold text-gray-900 mt-2">{meal || "Meal not available"}</p></div>; }
