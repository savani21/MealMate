import { useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  Sparkles,
  Target,
  Utensils,
  AlertCircle,
  ShoppingBasket,
  Search,
  ThumbsUp,
} from "lucide-react";

export default function MealPlanner() {
  const [, setLocation] = useLocation();

  const [goal, setGoal] = useState("");
  const [diet, setDiet] = useState("");
  const [allergies, setAllergies] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [duration, setDuration] = useState("7");
  const [ingredientMode, setIngredientMode] = useState("available");
  const [recommendedIngredients, setRecommendedIngredients] = useState([]);
  const [recommendationLoading, setRecommendationLoading] = useState(false);

  const [generated, setGenerated] = useState(false);
  const [mealPlan, setMealPlan] = useState([]);
  const [loading, setLoading] = useState(false);

  const getRecommendedIngredients = async () => {
    if (recommendedIngredients.length > 0) return recommendedIngredients;

    try {
      setRecommendationLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/recipes/recommended"
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to get recommendations");
      }

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

  const findRecipes = (mode) => {
    const available = ingredients
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (mode === "available" && available.length === 0) {
      alert("Enter your available ingredients first.");
      return;
    }

    if (mode === "recommended") {
      getRecommendedIngredients().then((recommended) => {
        const combined = [...new Set([...available, ...recommended])];
        if (combined.length === 0) {
          alert("No ingredients are available yet.");
          return;
        }
        setLocation(`/recipes?ingredients=${encodeURIComponent(combined.join(","))}`);
      });
      return;
    }

    setLocation(`/recipes?ingredients=${encodeURIComponent(available.join(","))}`);
  };

  const generatePlan = async () => {
    if (!goal || !diet) {
      alert("Please select your goal and diet type.");
      return;
    }

    try {
      setLoading(true);
      setGenerated(false);

      const token = localStorage.getItem("token");

      if (!token) {
        alert("Please login again.");
        setLocation("/login");
        return;
      }

      let finalIngredients = ingredients;

      if (ingredientMode === "recommended") {
        const recommended = await getRecommendedIngredients();
        const available = ingredients
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
        finalIngredients = [...new Set([...available, ...recommended])].join(", ");
      }

      const response = await fetch(
        "http://localhost:5000/api/meal-plans",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            goal,
            diet,
            allergies,
            ingredients: finalIngredients,
            duration: Number(duration),
          }),
        }
      );

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
            <button
              onClick={() => setLocation("/dashboard")}
              className="flex items-center gap-2 text-gray-600 hover:text-primary transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Dashboard</span>
            </button>

            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              <span className="text-xl font-black text-gray-900">
                Meal<span className="text-primary">Mate</span>
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <section className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-primary text-sm font-semibold">
            <Sparkles className="w-4 h-4" />
            Powered by AI
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mt-4">
            AI Meal Planner
          </h1>
          <p className="text-gray-500 mt-3 max-w-2xl mx-auto">
            Tell MealMate about your food preferences and goals. Our AI will create a personalized meal plan for you.
          </p>
        </section>

        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">Tell us about yourself</h2>
              <p className="text-sm text-gray-500">This helps AI create a better meal plan.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">What is your goal?</label>
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">Food Allergies</label>
              <div className="relative">
                <AlertCircle className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                <input type="text" value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="e.g. peanuts, dairy" className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 outline-none focus:border-primary" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Plan Duration</label>
              <select value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white outline-none focus:border-primary">
                <option value="3">3 Days</option>
                <option value="7">7 Days</option>
                <option value="14">14 Days</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Available Ingredients</label>
              <div className="relative">
                <ShoppingBasket className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                <input type="text" value={ingredients} onChange={(e) => setIngredients(e.target.value)} placeholder="e.g. rice, paneer, tomato, spinach" className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 outline-none focus:border-primary" />
              </div>
              <p className="text-xs text-gray-400 mt-2">Separate ingredients with commas.</p>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-100 pt-8">
            <h3 className="font-black text-gray-900 text-lg mb-4">How should MealMate use your ingredients?</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setIngredientMode("available")}
                className={`text-left rounded-2xl border-2 p-5 transition ${ingredientMode === "available" ? "border-primary bg-green-50" : "border-gray-100 bg-white hover:border-gray-200"}`}
              >
                <div className="flex items-center gap-3">
                  <ShoppingBasket className="w-5 h-5 text-primary" />
                  <span className="font-bold text-gray-900">Only My Ingredients</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">Create the meal plan using only the ingredients you already have.</p>
                <span
                  onClick={(e) => { e.stopPropagation(); findRecipes("available"); }}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary mt-4 hover:underline"
                >
                  <Search className="w-4 h-4" /> Find Recipes for These Ingredients
                </span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  setIngredientMode("recommended");
                  await getRecommendedIngredients();
                }}
                className={`text-left rounded-2xl border-2 p-5 transition ${ingredientMode === "recommended" ? "border-primary bg-green-50" : "border-gray-100 bg-white hover:border-gray-200"}`}
              >
                <div className="flex items-center gap-3">
                  <ThumbsUp className="w-5 h-5 text-primary" />
                  <span className="font-bold text-gray-900">Add Popular Ingredients</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">Use your ingredients plus ingredients from recipes liked by the most users.</p>
                {recommendationLoading ? (
                  <p className="text-sm text-primary font-semibold mt-4">Finding popular ingredients...</p>
                ) : recommendedIngredients.length > 0 ? (
                  <>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {recommendedIngredients.slice(0, 8).map((item) => (
                        <span key={item} className="px-2.5 py-1 rounded-full bg-white border border-green-100 text-xs font-medium text-gray-600">{item}</span>
                      ))}
                    </div>
                    <span
                      onClick={(e) => { e.stopPropagation(); findRecipes("recommended"); }}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-primary mt-4 hover:underline"
                    >
                      <Search className="w-4 h-4" /> Find Recipes with These Ingredients
                    </span>
                  </>
                ) : (
                  <p className="text-xs text-gray-400 mt-4">Popular ingredients will appear after users start liking recipes.</p>
                )}
              </button>
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

function MealCard({ icon, title, meal }) {
  return (
    <div className="border border-gray-100 rounded-2xl p-5">
      <div className="text-3xl">{icon}</div>
      <p className="text-xs uppercase tracking-wide font-bold text-primary mt-4">{title}</p>
      <h3 className="font-bold text-gray-900 mt-2">{meal || "Meal not available"}</h3>
    </div>
  );
}