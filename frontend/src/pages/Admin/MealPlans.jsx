import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  ClipboardList,
  Trash2,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function MealPlans() {
  const [, setLocation] = useLocation();

  const [mealPlans, setMealPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchMealPlans();
  }, []);

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  const fetchMealPlans = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setLocation("/login");
        return;
      }

      const response = await fetch("http://localhost:5000/api/admin/meal-plans", {
        headers: authHeaders(),
      });

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

  const removeMealPlan = async (plan) => {
    if (!confirm("Delete this meal plan? This cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/admin/meal-plans/${plan._id}`,
        { method: "DELETE", headers: authHeaders() }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to delete meal plan");
        return;
      }

      setMealPlans((prev) => prev.filter((p) => p._id !== plan._id));
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server.");
    }
  };

  const filteredPlans = mealPlans.filter((plan) => {
    const q = search.toLowerCase();
    return (
      plan.user?.name?.toLowerCase().includes(q) ||
      plan.user?.email?.toLowerCase().includes(q) ||
      plan.goal?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#f7faf7]">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto h-20 px-4 sm:px-6 lg:px-8 flex items-center gap-4">
          <button
            onClick={() => setLocation("/dashboard")}
            className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900">Meal Plans</h1>
              <p className="text-xs text-gray-400">
                {mealPlans.length} plans across all users
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="relative mb-6 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by user or goal..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {loading ? (
          <p className="text-gray-400">Loading meal plans...</p>
        ) : filteredPlans.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
            No meal plans found.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPlans.map((plan) => {
              const isOpen = expandedId === plan._id;

              return (
                <div
                  key={plan._id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                >
                  <div className="p-5 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-900">
                          {plan.user?.name || "Unknown user"}
                        </h3>
                        <span className="text-xs text-gray-400">{plan.user?.email}</span>
                      </div>

                      <p className="text-sm text-gray-500 mt-1">
                        Goal: <span className="font-medium text-gray-700">{plan.goal}</span>{" "}
                        · Diet: <span className="font-medium text-gray-700">{plan.diet}</span>{" "}
                        · {plan.duration} days
                      </p>

                      <p className="text-xs text-gray-400 mt-1">
                        Created{" "}
                        {plan.createdAt
                          ? new Date(plan.createdAt).toLocaleDateString()
                          : "--"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setExpandedId(isOpen ? null : plan._id)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition"
                      >
                        {isOpen ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                        {isOpen ? "Hide" : "View"}
                      </button>

                      <button
                        onClick={() => removeMealPlan(plan)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-red-500 border border-red-100 rounded-lg px-3 py-2 hover:bg-red-50 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="border-t border-gray-100 bg-gray-50/60 p-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(plan.meals || []).map((day, i) => (
                          <div
                            key={i}
                            className="bg-white rounded-xl border border-gray-100 p-4"
                          >
                            <p className="text-xs font-bold uppercase tracking-wide text-primary mb-2">
                              Day {day.day ?? i + 1}
                            </p>
                            <p className="text-sm text-gray-600">🍳 {day.breakfast || "--"}</p>
                            <p className="text-sm text-gray-600">🥗 {day.lunch || "--"}</p>
                            <p className="text-sm text-gray-600">🍽️ {day.dinner || "--"}</p>
                            <p className="text-sm text-gray-600">🍎 {day.snack || "--"}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
