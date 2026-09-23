import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Sparkles, Target, ShoppingBasket, Search, ThumbsUp } from "lucide-react";

export default function MealPlanner() {
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(window.location.search);

  const [goal, setGoal] = useState("");
  const [diet, setDiet] = useState("");
  const [ingredients, setIngredients] = useState(params.get("ingredients") || "");
  const [duration, setDuration] = useState("3");
  const [ingredientMode, setIngredientMode] = useState(params.get("mode") || "available");
  const [recommendedIngredients, setRecommendedIngredients] = useState(
    params.get("recommended") ? params.get("recommended").split(",").filter(Boolean) : []
  );
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [loading, setLoading] = useState(false);

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
    } finally {
      setRecommendationLoading(false);
    }
  };

  const getAvailableIngredients = () =>
    ingredients.split(",").map((item) => item.trim()).filter(Boolean);

  const openRecipeGenerator = async (mode) => {
    const available = getAvailableIngredients();
    if (available.length === 0) {
      alert("Enter your available ingredients first.");
      return;
    }

    let combined = available;
    let recommended = [];

    if (mode === "recommended") {
      recommended = await getRecommendedIngredients();
      combined = [...new Set([...available, ...recommended])];
    }

    const query = new URLSearchParams({
      generate: "1",
      ingredients: combined.join(","),
      return: "meal-planner",
      available: available.join(","),
      recommended: recommended.join(","),
      mode,
    });

    setLocation(`/recipes?${query.toString()}`);
  };

  const generatePlan = async () => {
    if (!goal || !diet) {
      alert("Please select your goal and diet type.");
      return;
    }

    const available = getAvailableIngredients();
    if (available.length === 0) {
      alert("Enter your available ingredients first.");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please login again.");
        setLocation("/login");
        return;
      }

      let finalIngredients = available;
      if (ingredientMode === "recommended") {
        const recommended = await getRecommendedIngredients();
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
          ingredients: finalIngredients.join(", "),
          duration: Number(duration),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.message || "Failed to generate meal plan");
        return;
      }

      if (!data.mealPlan?._id) {
        alert("Meal plan was generated but no plan ID was returned.");
        return;
      }

      setLocation(`/meal-plans/${data.mealPlan._id}`);
    } catch (error) {
      console.error("Meal plan error:", error);
      alert("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7faf7]">
      <header className="bg-white border-b border-gray-100">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="h-20 flex items-center justify-between">
            <button onClick={() => setLocation("/dashboard")} className="flex items-center gap-2 text-gray-600 hover:text-primary transition">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Dashboard</span>
            </button>
            <span className="text-xl font-black text-gray-900">Meal<span className="text-primary">Mate</span></span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <section className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-primary text-sm font-semibold">
            <Sparkles className="w-4 h-4" /> Powered by AI
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mt-4">AI Meal Planner</h1>
          <p className="text-gray-500 mt-3 max-w-2xl mx-auto">Create a practical meal plan around your preferences and the ingredients you have.</p>
        </section>

        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center"><Target className="w-6 h-6 text-primary" /></div>
            <div>
              <h2 className="text-xl font-black text-gray-900">Meal Plan Preferences</h2>
              <p className="text-sm text-gray-500">Choose the options that fit your current needs.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Goal</label>
              <select value={goal} onChange={(e) => setGoal(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white outline-none focus:border-primary">
                <option value="">Select your goal</option>
                <option value="weight-loss">Weight Loss</option>
                <option value="weight-gain">Weight Gain</option>
                <option value="muscle-gain">Muscle Gain</option>
                <option value="healthy-eating">Healthy Eating</option>
                <option value="maintenance">Maintain Weight</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Diet Type</label>
              <select value={diet} onChange={(e) => setDiet(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white outline-none focus:border-primary">
                <option value="">Select diet type</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="non-vegetarian">Non-Vegetarian</option>
                <option value="eggetarian">Eggetarian</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Plan Duration</label>
              <select value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white outline-none focus:border-primary">
                <option value="1">1 Day</option>
                <option value="3">3 Days</option>
                <option value="7">7 Days</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Available Ingredients</label>
              <div className="relative">
                <ShoppingBasket className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                <input type="text" value={ingredients} onChange={(e) => setIngredients(e.target.value)} placeholder="e.g. rice, paneer, tomato, spinach" className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 outline-none focus:border-primary" />
              </div>
              <p className="text-xs text-gray-400 mt-2">Separate ingredients with commas.</p>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-100 pt-8">
            <h3 className="font-black text-gray-900 text-lg mb-4">Ingredient Preference</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`rounded-2xl border-2 p-5 ${ingredientMode === "available" ? "border-primary bg-green-50" : "border-gray-100"}`}>
                <div className="flex items-center gap-3"><ShoppingBasket className="w-5 h-5 text-primary" /><span className="font-bold text-gray-900">Only Available Ingredients</span></div>
                <p className="text-sm text-gray-500 mt-2">Build the meal plan using only what you already have.</p>
                <div className="flex flex-wrap gap-3 mt-4">
                  <button type="button" onClick={() => setIngredientMode("available")} className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-semibold">Use This Option</button>
                  <button type="button" onClick={() => openRecipeGenerator("available")} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold"><Sparkles className="w-4 h-4" /> Generate Recipe</button>
                </div>
              </div>

              <div className={`rounded-2xl border-2 p-5 ${ingredientMode === "recommended" ? "border-primary bg-green-50" : "border-gray-100"}`}>
                <div className="flex items-center gap-3"><ThumbsUp className="w-5 h-5 text-primary" /><span className="font-bold text-gray-900">Available + Popular Ingredients</span></div>
                <p className="text-sm text-gray-500 mt-2">Use your ingredients plus ingredients from recipes liked by the most users.</p>
                {recommendationLoading ? <p className="text-sm text-primary font-semibold mt-4">Loading popular ingredients...</p> : recommendedIngredients.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-4">{recommendedIngredients.slice(0, 8).map((item) => <span key={item} className="px-2.5 py-1 rounded-full bg-white border border-green-100 text-xs font-medium text-gray-600">{item}</span>)}</div>
                ) : <p className="text-xs text-gray-400 mt-4">Popular ingredients will appear as recipes receive more likes.</p>}
                <div className="flex flex-wrap gap-3 mt-4">
                  <button type="button" onClick={async () => { setIngredientMode("recommended"); await getRecommendedIngredients(); }} className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-semibold">Use This Option</button>
                  <button type="button" onClick={() => openRecipeGenerator("recommended")} disabled={recommendationLoading} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold disabled:opacity-50"><Sparkles className="w-4 h-4" /> Generate Recipe</button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <button onClick={generatePlan} disabled={loading || recommendationLoading} className="w-full md:w-auto md:min-w-[260px] mx-auto flex items-center justify-center gap-2 bg-primary text-white px-6 py-3.5 rounded-xl font-bold hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed">
              <Sparkles className="w-5 h-5" />
              {loading ? "Generating Your Meal Plan..." : "Generate AI Meal Plan"}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
