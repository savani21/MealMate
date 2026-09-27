import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Sparkles, Utensils, Clock, Search, ArrowDownUp, Trash2 } from "lucide-react";

export default function MyMealPlans() {
  const [, setLocation] = useLocation();
  const [mealPlans, setMealPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [showSort, setShowSort] = useState(false);
  const [deletingPlanId, setDeletingPlanId] = useState(null);

  useEffect(() => {
    fetchMealPlans();
  }, []);

  const getToken = () => localStorage.getItem("token");

  const fetchMealPlans = async () => {
    try {
      const token = getToken();
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
      console.error("Load meal plans error:", error);
      alert("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (event, plan) => {
    event.stopPropagation();

    const confirmed = window.confirm(
      `Delete this meal plan?\n\n${getPlanTitle(plan)}\n${formatCreatedAt(plan.createdAt)}\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    const token = getToken();
    if (!token) {
      setLocation("/login");
      return;
    }

    try {
      setDeletingPlanId(plan._id);

      const response = await fetch(
        `http://localhost:5000/api/meal-plans/${encodeURIComponent(plan._id)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const responseText = await response.text();
      let data = {};

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = { message: responseText };
      }

      if (!response.ok) {
        console.error("Delete meal plan failed:", response.status, data);
        alert(data.message || `Unable to delete meal plan (${response.status}).`);
        return;
      }

      setMealPlans((currentPlans) =>
        currentPlans.filter((currentPlan) => currentPlan._id !== plan._id)
      );
    } catch (error) {
      console.error("Delete meal plan error:", error);
      alert("Unable to connect to the server. Make sure the backend is running on port 5000.");
    } finally {
      setDeletingPlanId(null);
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

  const formatDateHeading = (createdAt) => {
    if (!createdAt) return "Date unavailable";
    return new Date(createdAt).toLocaleDateString([], {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const getLocalDateKey = (date) => {
    if (!date) return "unknown";
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  const getPlanTitle = (plan) => {
    const goal = plan.goal?.toString().trim();
    const diet = plan.diet?.toString().trim();
    if (goal && diet) return `${goal} • ${diet}`;
    if (goal) return goal;
    if (diet) return `${diet} Meal Plan`;
    return `${plan.duration}-Day Meal Plan`;
  };

  const sortedMealPlans = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const matchingPlans = mealPlans.filter((plan) => {
      if (!normalizedSearch) return true;
      const createdDate = plan.createdAt ? new Date(plan.createdAt) : null;
      const formattedDate = createdDate ? createdDate.toLocaleDateString().toLowerCase() : "";
      return [
        getPlanTitle(plan),
        `${plan.duration}-day meal plan`,
        plan.goal,
        plan.diet,
        formattedDate,
        createdDate?.toLocaleString(),
      ].some((value) => value?.toString().toLowerCase().includes(normalizedSearch));
    });

    return [...matchingPlans].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (sortOrder === "oldest") return dateA - dateB;
      if (sortOrder === "shortest") return Number(a.duration || 0) - Number(b.duration || 0);
      if (sortOrder === "longest") return Number(b.duration || 0) - Number(a.duration || 0);
      return dateB - dateA;
    });
  }, [mealPlans, search, sortOrder]);

  const groupedMealPlans = useMemo(() => {
    return sortedMealPlans.reduce((groups, plan) => {
      const date = plan.createdAt ? new Date(plan.createdAt) : null;
      const key = getLocalDateKey(date);
      if (!groups[key]) groups[key] = { label: formatDateHeading(plan.createdAt), plans: [] };
      groups[key].plans.push(plan);
      return groups;
    }, {});
  }, [sortedMealPlans]);

  const sortLabel = {
    newest: "Newest first",
    oldest: "Oldest first",
    shortest: "Shortest plan first",
    longest: "Longest plan first",
  }[sortOrder];

  return (
    <div className="min-h-screen bg-[#f7faf7]">
      <header className="bg-white border-b border-gray-100">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="h-20 flex items-center justify-between">
            <button onClick={() => setLocation("/dashboard")} className="flex items-center gap-2 text-gray-600 hover:text-primary transition">
              <ArrowLeft className="w-5 h-5" /> Back to Dashboard
            </button>
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              <span className="text-xl font-black text-gray-900">Meal<span className="text-primary">Mate</span></span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900">My Meal Plans</h1>
          <p className="text-gray-500 mt-2">View and compare all of your previously created meal plans.</p>
        </div>

        {!loading && mealPlans.length > 0 && (
          <div className="mb-7 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by goal, diet, date..." className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="relative">
              <button onClick={() => setShowSort((value) => !value)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-gray-200 bg-white font-semibold text-gray-700 hover:border-primary transition">
                <ArrowDownUp className="w-5 h-5" /> Sort: {sortLabel}
              </button>
              {showSort && (
                <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-gray-100 bg-white shadow-lg p-2">
                  {[["newest", "Newest first"], ["oldest", "Oldest first"], ["shortest", "Shortest plan first"], ["longest", "Longest plan first"]].map(([value, label]) => (
                    <button key={value} onClick={() => { setSortOrder(value); setShowSort(false); }} className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition ${sortOrder === value ? "bg-green-50 text-primary font-semibold" : "text-gray-700 hover:bg-gray-50"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {loading && <div className="text-center py-16 text-gray-500">Loading your meal plans...</div>}

        {!loading && sortedMealPlans.length === 0 && (
          <div className="bg-white rounded-3xl border border-gray-100 p-10 text-center">
            <Sparkles className="w-10 h-10 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900">{mealPlans.length === 0 ? "No meal plans yet" : "No matching meal plans"}</h2>
            <p className="text-gray-500 mt-2">{mealPlans.length === 0 ? "Create your first personalized AI meal plan." : "Try changing your search."}</p>
            {mealPlans.length === 0 && <button onClick={() => setLocation("/meal-planner")} className="mt-6 px-6 py-3 rounded-xl bg-primary text-white font-bold">Create Meal Plan</button>}
          </div>
        )}

        {!loading && sortedMealPlans.length > 0 && (
          <div className="space-y-8">
            {Object.entries(groupedMealPlans).map(([dateKey, group]) => (
              <section key={dateKey}>
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">{group.label}</h2>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>
                <div className="space-y-3">
                  {group.plans.map((plan) => (
                    <div key={plan._id} className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-primary/40 hover:shadow-md transition">
                      <div className="flex items-center gap-4">
                        <button onClick={() => setLocation(`/meal-plans/${plan._id}`)} className="min-w-0 flex-1 text-left">
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 shrink-0 rounded-xl bg-green-50 flex items-center justify-center"><Utensils className="w-5 h-5 text-primary" /></div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                                <h2 className="font-black text-lg text-gray-900 truncate">{getPlanTitle(plan)}</h2>
                                <span className="text-sm text-gray-500 flex items-center gap-1 shrink-0"><Clock className="w-4 h-4" />{formatCreatedAt(plan.createdAt)}</span>
                              </div>
                              <p className="text-sm text-gray-500 capitalize mt-1">{plan.duration}-Day Plan</p>
                            </div>
                          </div>
                        </button>
                        <button type="button" onClick={(event) => handleDelete(event, plan)} disabled={deletingPlanId === plan._id} title="Delete meal plan" aria-label={`Delete ${getPlanTitle(plan)}`} className="shrink-0 p-2.5 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
