import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Sparkles, Utensils } from "lucide-react";

export default function MyMealPlans() {
  const [, setLocation] = useLocation();

  const [mealPlans, setMealPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMealPlans();
  }, []);

  const fetchMealPlans = async () => {
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
        alert(data.message || "Failed to load meal plans");
        return;
      }

      setMealPlans(data.mealPlans || []);
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7faf7]">

      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="w-full px-4 sm:px-6 lg:px-8">

          <div className="h-20 flex items-center justify-between">

            <button
              onClick={() => setLocation("/dashboard")}
              className="flex items-center gap-2 text-gray-600 hover:text-primary transition"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
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

        <div className="mb-8">

          <h1 className="text-3xl font-black text-gray-900">
            My Meal Plans
          </h1>

          <p className="text-gray-500 mt-2">
            View your previously generated AI meal plans.
          </p>

        </div>


        {/* Loading */}
        {loading && (
          <div className="text-center py-16 text-gray-500">
            Loading your meal plans...
          </div>
        )}


        {/* Empty */}
        {!loading && mealPlans.length === 0 && (
          <div className="bg-white rounded-3xl border border-gray-100 p-10 text-center">

            <Sparkles className="w-10 h-10 text-primary mx-auto mb-4" />

            <h2 className="text-xl font-bold text-gray-900">
              No meal plans yet
            </h2>

            <p className="text-gray-500 mt-2">
              Create your first personalized AI meal plan.
            </p>

            <button
              onClick={() => setLocation("/meal-planner")}
              className="mt-6 px-6 py-3 rounded-xl bg-primary text-white font-bold"
            >
              Create Meal Plan
            </button>

          </div>
        )}


        {/* Plans */}
        {!loading && mealPlans.length > 0 && (

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {mealPlans.map((plan) => (

              <div
                key={plan._id}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6"
              >

                <div className="flex items-center gap-4">

                  <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                    <Utensils className="w-6 h-6 text-primary" />
                  </div>

                  <div>

                    <h2 className="font-black text-lg text-gray-900">
                      {plan.duration}-Day Meal Plan
                    </h2>

                    <p className="text-sm text-gray-500 capitalize">
                      {plan.goal} • {plan.diet}
                    </p>

                  </div>

                </div>


                <div className="mt-5 grid grid-cols-2 gap-3">

                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500">
                      Goal
                    </p>

                    <p className="font-semibold text-gray-900 capitalize">
                      {plan.goal}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500">
                      Diet
                    </p>

                    <p className="font-semibold text-gray-900 capitalize">
                      {plan.diet}
                    </p>
                  </div>

                </div>


                <button
                  onClick={() =>
                    setLocation(`/meal-plans/${plan._id}`)
                  }
                  className="w-full mt-5 py-3 rounded-xl bg-primary text-white font-bold hover:opacity-90 transition"
                >
                  View Meal Plan
                </button>

              </div>

            ))}

          </div>

        )}

      </main>

    </div>
  );
}