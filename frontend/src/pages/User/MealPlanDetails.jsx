import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import {
  ArrowLeft,
  Sparkles,
  Utensils,
  ShoppingBasket,
} from "lucide-react";

export default function MealPlanDetails() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/meal-plans/:id");

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [groceryLoading, setGroceryLoading] = useState(false);

  useEffect(() => {
    fetchMealPlan();
  }, []);

  const fetchMealPlan = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setLocation("/login");
        return;
      }

      const response = await fetch(
        "http://localhost:5000/api/meal-plans",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to load meal plan");
        return;
      }

      const selectedPlan = data.mealPlans.find(
        (item) => item._id === params.id
      );

      if (!selectedPlan) {
        alert("Meal plan not found");
        setLocation("/my-meal-plans");
        return;
      }

      setPlan(selectedPlan);
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  // Generate Grocery List
  const generateGroceryList = async () => {
    try {
      setGroceryLoading(true);

      const token = localStorage.getItem("token");

      if (!token) {
        setLocation("/login");
        return;
      }

      const response = await fetch(
        "http://localhost:5000/api/user/grocery",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            mealPlanId: plan._id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to create grocery list");
        return;
      }

      alert("Grocery list created successfully!");

      setLocation("/user/grocery");
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server.");
    } finally {
      setGroceryLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7faf7]">
        <p className="text-gray-500">
          Loading meal plan...
        </p>
      </div>
    );
  }

  if (!plan) return null;

  return (
    <div className="min-h-screen bg-[#f7faf7]">

      {/* Header */}

      <header className="bg-white border-b border-gray-100">

        <div className="w-full px-4 sm:px-6 lg:px-8">

          <div className="h-20 flex items-center justify-between">

            <button
              onClick={() => setLocation("/my-meal-plans")}
              className="flex items-center gap-2 text-gray-600 hover:text-primary transition"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to My Meal Plans
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


      {/* Main */}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Title */}

        <section className="text-center mb-10">

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-primary text-sm font-semibold">

            <Sparkles className="w-4 h-4" />

            AI Generated Plan

          </div>

          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mt-4">
            Your {plan.duration}-Day Meal Plan
          </h1>

          <p className="text-gray-500 mt-3">
            Personalized according to your goals and food preferences.
          </p>

        </section>


        {/* Plan Information */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

          <InfoCard
            title="Goal"
            value={plan.goal}
          />

          <InfoCard
            title="Diet"
            value={plan.diet}
          />

          <InfoCard
            title="Duration"
            value={`${plan.duration} Days`}
          />

        </div>


        {/* Meals */}

        <section className="space-y-6">

          {plan.meals.map((day) => (

            <div
              key={day.day}
              className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8"
            >

              <div className="flex items-center gap-3 mb-6">

                <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center">

                  <Utensils className="w-5 h-5 text-primary" />

                </div>

                <h2 className="text-xl font-black text-gray-900">
                  Day {day.day}
                </h2>

              </div>


              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                <MealCard
                  icon="🌅"
                  title="Breakfast"
                  meal={day.breakfast}
                />

                <MealCard
                  icon="☀️"
                  title="Lunch"
                  meal={day.lunch}
                />

                <MealCard
                  icon="🍎"
                  title="Snack"
                  meal={day.snack}
                />

                <MealCard
                  icon="🌙"
                  title="Dinner"
                  meal={day.dinner}
                />

              </div>

            </div>

          ))}

        </section>


        {/* Generate Grocery List */}

        <div className="flex justify-center mt-8">

          <button
            onClick={generateGroceryList}
            disabled={groceryLoading}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >

            <ShoppingBasket className="w-5 h-5" />

            {groceryLoading
              ? "Creating Grocery List..."
              : "Generate Grocery List"}

          </button>

        </div>


        {/* AI Note */}

        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mt-8">

          <Sparkles className="w-4 h-4 text-primary" />

          Meal plan generated by MealMate AI

        </div>

      </main>

    </div>
  );
}


/* Info Card */

function InfoCard({ title, value }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">

      <p className="text-sm text-gray-500">
        {title}
      </p>

      <p className="text-lg font-bold text-gray-900 capitalize mt-1">
        {value}
      </p>

    </div>
  );
}


/* Meal Card */

function MealCard({ icon, title, meal }) {
  return (
    <div className="border border-gray-100 rounded-2xl p-5">

      <div className="text-3xl">
        {icon}
      </div>

      <p className="text-xs uppercase tracking-wide font-bold text-primary mt-4">
        {title}
      </p>

      <p className="font-bold text-gray-900 mt-2">
        {meal || "Meal not available"}
      </p>

    </div>
  );
}