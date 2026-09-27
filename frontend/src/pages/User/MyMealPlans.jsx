import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Sparkles, Utensils, Clock, Search, SlidersHorizontal } from "lucide-react";

export default function MyMealPlans() {
  const [, setLocation] = useLocation();

  const [mealPlans, setMealPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [durationFilter, setDurationFilter] = useState("all");
  const [dietFilter, setDietFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

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

      const response = await fetch("http://localhost:5000/api/meal-plans", {
        headers: { Authorization: `Bearer ${token}` },
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

  const formatCreatedAt = (createdAt) => {
    if (!createdAt) return "Creation time unavailable";

    return new Date(createdAt).toLocaleString([], {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const localDateKey = (date) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getPlanTitle = (plan) => {
    const goal = plan.goal?.toString().trim();
    const diet = plan.diet?.toString().trim();

    if (goal && diet) return `${goal} • ${diet}`;
    if (goal) return goal;
    if (diet) return `${diet} Meal Plan`;
    return `${plan.duration}-Day Meal Plan`;
  };

  const filteredMealPlans = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return mealPlans.filter((plan) => {
      const createdDate = plan.createdAt ? new Date(plan.createdAt) : null;
      const formattedDate = createdDate
        ? createdDate.toLocaleDateString().toLowerCase()
        : "";
      const planTitle = getPlanTitle(plan).toLowerCase();

      const matchesSearch = !normalizedSearch || [
        planTitle,
        `${plan.duration}-day meal plan`,
        plan.goal,
        plan.diet,
        formattedDate,
        createdDate?.toLocaleString().toLowerCase(),
      ].some((value) => value?.toString().includes(normalizedSearch));

      const matchesDuration =
        durationFilter === "all" || String(plan.duration) === durationFilter;

      const matchesDiet =
        dietFilter === "all" || String(plan.diet).toLowerCase() === dietFilter.toLowerCase();

      const matchesDate =
        !dateFilter ||
        (createdDate && localDateKey(createdDate) === dateFilter);

      return matchesSearch && matchesDuration && matchesDiet && matchesDate;
    });
  }, [mealPlans, search, durationFilter, dietFilter, dateFilter]);

  const clearFilters = () => {
    setSearch("");
    setDateFilter("");
    setDurationFilter("all");
    setDietFilter("all");
    setShowFilters(false);
  };

  const applyFilters = () => {
    setShowFilters(false);
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

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900">My Meal Plans</h1>
          <p className="text-gray-500 mt-2">
            View and compare all of your previously created meal plans.
          </p>
        </div>

        {!loading && mealPlans.length > 0 && (
          <div className="mb-6 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by goal, diet, date..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <button
                onClick={() => setShowFilters((value) => !value)}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-gray-200 bg-white font-semibold text-gray-700 hover:border-primary transition"
              >
                <SlidersHorizontal className="w-5 h-5" />
                Filter
              </button>
            </div>

            {showFilters && (
              <div className="bg-white border border-gray-100 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label className="text-sm font-semibold text-gray-700">
                  Date
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(event) => setDateFilter(event.target.value)}
                    className="mt-2 w-full px-3 py-2.5 rounded-lg border border-gray-200 font-normal"
                  />
                </label>

                <label className="text-sm font-semibold text-gray-700">
                  Duration
                  <select
                    value={durationFilter}
                    onChange={(event) => setDurationFilter(event.target.value)}
                    className="mt-2 w-full px-3 py-2.5 rounded-lg border border-gray-200 font-normal"
                  >
                    <option value="all">All durations</option>
                    <option value="1">1 Day</option>
                    <option value="3">3 Days</option>
                    <option value="7">7 Days</option>
                  </select>
                </label>

                <label className="text-sm font-semibold text-gray-700">
                  Diet Type
                  <select
                    value={dietFilter}
                    onChange={(event) => setDietFilter(event.target.value)}
                    className="mt-2 w-full px-3 py-2.5 rounded-lg border border-gray-200 font-normal capitalize"
                  >
                    <option value="all">All diets</option>
                    {[...new Set(mealPlans.map((plan) => plan.diet).filter(Boolean))].map((diet) => (
                      <option key={diet} value={diet}>
                        {diet}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="sm:col-span-3 flex gap-3 justify-end">
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    Clear Filters
                  </button>
                  <button
                    onClick={applyFilters}
                    className="px-5 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90"
                  >
                    Apply Filter
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="text-center py-16 text-gray-500">
            Loading your meal plans...
          </div>
        )}

        {!loading && filteredMealPlans.length === 0 && (
          <div className="bg-white rounded-3xl border border-gray-100 p-10 text-center">
            <Sparkles className="w-10 h-10 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900">
              {mealPlans.length === 0 ? "No meal plans yet" : "No matching meal plans"}
            </h2>
            <p className="text-gray-500 mt-2">
              {mealPlans.length === 0
                ? "Create your first personalized AI meal plan."
                : "Try changing your search or filters."}
            </p>
            {mealPlans.length === 0 && (
              <button
                onClick={() => setLocation("/meal-planner")}
                className="mt-6 px-6 py-3 rounded-xl bg-primary text-white font-bold"
              >
                Create Meal Plan
              </button>
            )}
          </div>
        )}

        {!loading && filteredMealPlans.length > 0 && (
          <div className="space-y-3">
            {filteredMealPlans.map((plan) => (
              <button
                key={plan._id}
                onClick={() => setLocation(`/meal-plans/${plan._id}`)}
                className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-primary/40 hover:shadow-md transition"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 shrink-0 rounded-xl bg-green-50 flex items-center justify-center">
                    <Utensils className="w-5 h-5 text-primary" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <h2 className="font-black text-lg text-gray-900 truncate">
                        {getPlanTitle(plan)}
                      </h2>
                      <span className="text-sm text-gray-500 flex items-center gap-1 shrink-0">
                        <Clock className="w-4 h-4" />
                        {formatCreatedAt(plan.createdAt)}
                      </span>
                    </div>

                    <p className="text-sm text-gray-500 capitalize mt-1">
                      {plan.duration}-Day Plan
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
