import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Sparkles, Utensils, Clock, Search, ArrowDownUp, Trash2, Archive, ArchiveRestore } from "lucide-react";

export default function MyMealPlans() {
  const [, setLocation] = useLocation();
  const [mealPlans, setMealPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [showSort, setShowSort] = useState(false);
  const [viewMode, setViewMode] = useState("active");
  const [processingPlanId, setProcessingPlanId] = useState(null);

  useEffect(() => {
    fetchMealPlans();
  }, [viewMode]);

  const getToken = () => localStorage.getItem("token");

  const fetchMealPlans = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        setLocation("/login");
        return;
      }

      const query = viewMode === "archived" ? "?includeArchived=true" : "";
      const response = await fetch(`http://localhost:5000/api/meal-plans${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to load meal plans");
        return;
      }

      const plans = viewMode === "archived"
        ? (data.mealPlans || []).filter((plan) => plan.isArchived)
        : (data.mealPlans || []).filter((plan) => !plan.isArchived);
      setMealPlans(plans);
    } catch (error) {
      console.error("Load meal plans error:", error);
      alert("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const formatCreatedAt = (createdAt) => {
    if (!createdAt) return "Creation time unavailable";
    return new Date(createdAt).toLocaleString([], {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const formatDateHeading = (createdAt) => {
    if (!createdAt) return "Date unavailable";
    return new Date(createdAt).toLocaleDateString([], {
      day: "2-digit", month: "long", year: "numeric",
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

  const handleArchive = async (event, plan) => {
    event.stopPropagation();
    const confirmed = window.confirm(
      `Archive this meal plan?\n\n${getPlanTitle(plan)}\n${formatCreatedAt(plan.createdAt)}\n\nYou can restore it later from Archived.`
    );
    if (!confirmed) return;

    const token = getToken();
    if (!token) return setLocation("/login");

    try {
      setProcessingPlanId(plan._id);
      const response = await fetch(`http://localhost:5000/api/meal-plans/${encodeURIComponent(plan._id)}/archive`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.message || "Unable to archive meal plan.");
        return;
      }
      setMealPlans((current) => current.filter((item) => item._id !== plan._id));
    } catch (error) {
      console.error("Archive meal plan error:", error);
      alert("Unable to connect to the server.");
    } finally {
      setProcessingPlanId(null);
    }
  };

  const handleRestore = async (event, plan) => {
    event.stopPropagation();
    const token = getToken();
    if (!token) return setLocation("/login");

    try {
      setProcessingPlanId(plan._id);
      const response = await fetch(`http://localhost:5000/api/meal-plans/${encodeURIComponent(plan._id)}/restore`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.message || "Unable to restore meal plan.");
        return;
      }
      setMealPlans((current) => current.filter((item) => item._id !== plan._id));
    } catch (error) {
      console.error("Restore meal plan error:", error);
      alert("Unable to connect to the server.");
    } finally {
      setProcessingPlanId(null);
    }
  };

  const handleDelete = async (event, plan) => {
    event.stopPropagation();
    const confirmed = window.confirm(
      `Delete this meal plan permanently?\n\n${getPlanTitle(plan)}\n${formatCreatedAt(plan.createdAt)}\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    const token = getToken();
    if (!token) return setLocation("/login");

    try {
      setProcessingPlanId(plan._id);
      const response = await fetch(`http://localhost:5000/api/meal-plans/${encodeURIComponent(plan._id)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const responseText = await response.text();
      let data = {};
      try { data = responseText ? JSON.parse(responseText) : {}; } catch { data = { message: responseText }; }
      if (!response.ok) {
        alert(data.message || `Unable to delete meal plan (${response.status}).`);
        return;
      }
      setMealPlans((current) => current.filter((item) => item._id !== plan._id));
    } catch (error) {
      console.error("Delete meal plan error:", error);
      alert("Unable to connect to the server.");
    } finally {
      setProcessingPlanId(null);
    }
  };

  const sortedMealPlans = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const matchingPlans = mealPlans.filter((plan) => {
      if (!normalizedSearch) return true;
      const createdDate = plan.createdAt ? new Date(plan.createdAt) : null;
      const formattedDate = createdDate ? createdDate.toLocaleDateString().toLowerCase() : "";
      return [getPlanTitle(plan), `${plan.duration}-day meal plan`, plan.goal, plan.diet, formattedDate, createdDate?.toLocaleString()]
        .some((value) => value?.toString().toLowerCase().includes(normalizedSearch));
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

  const groupedMealPlans = useMemo(() => sortedMealPlans.reduce((groups, plan) => {
    const date = plan.createdAt ? new Date(plan.createdAt) : null;
    const key = getLocalDateKey(date);
    if (!groups[key]) groups[key] = { label: formatDateHeading(plan.createdAt), plans: [] };
    groups[key].plans.push(plan);
    return groups;
  }, {}), [sortedMealPlans]);

  const sortLabel = {
    newest: "Newest first", oldest: "Oldest first", shortest: "Shortest plan first", longest: "Longest plan first",
  }[sortOrder];

  return (
    <div className="min-h-screen bg-[#f7faf7]">
      <header className="bg-white border-b border-gray-100">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="h-20 flex items-center justify-between">
            <button onClick={() => setLocation("/dashboard")} className="flex items-center gap-2 text-gray-600 hover:text-primary transition">
              <ArrowLeft className="w-5 h-5" /> Back to Dashboard
            </button>
            <div className="flex items-center gap-2"><Sparkles className="w-6 h-6 text-primary" /><span className="text-xl font-black text-gray-900">Meal<span className="text-primary">Mate</span></span></div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900">My Meal Plans</h1>
          <p className="text-gray-500 mt-2">View, compare, and organize your meal plan history.</p>
        </div>

        {!loading && (
          <div className="mb-7 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by goal, diet, date..." className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="relative">
                <button onClick={() => setShowSort((value) => !value)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-gray-200 bg-white font-semibold text-gray-700 hover:border-primary transition">
                  <ArrowDownUp className="w-5 h-5" /> Sort: {sortLabel}
                </button>
                {showSort && <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-gray-100 bg-white shadow-lg p-2">
                  {[["newest", "Newest first"], ["oldest", "Oldest first"], ["shortest", "Shortest plan first"], ["longest", "Longest plan first"]].map(([value, label]) => (
                    <button key={value} onClick={() => { setSortOrder(value); setShowSort(false); }} className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition ${sortOrder === value ? "bg-green-50 text-primary font-semibold" : "text-gray-700 hover:bg-gray-50"}`}>{label}</button>
                  ))}
                </div>}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => setViewMode("active")} className={`px-4 py-2 rounded-lg text-sm font-semibold ${viewMode === "active" ? "bg-primary text-white" : "bg-white text-gray-600 border border-gray-200"}`}>Active Plans</button>
              <button onClick={() => setViewMode("archived")} className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${viewMode === "archived" ? "bg-gray-800 text-white" : "bg-white text-gray-600 border border-gray-200"}`}><Archive className="w-4 h-4" /> Archived</button>
            </div>
          </div>
        )}

        {loading && <div className="text-center py-16 text-gray-500">Loading your meal plans...</div>}

        {!loading && sortedMealPlans.length === 0 && (
          <div className="bg-white rounded-3xl border border-gray-100 p-10 text-center">
            <Sparkles className="w-10 h-10 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900">{viewMode === "archived" ? "No archived meal plans" : mealPlans.length === 0 ? "No meal plans yet" : "No matching meal plans"}</h2>
            <p className="text-gray-500 mt-2">{viewMode === "archived" ? "Archived plans will appear here." : mealPlans.length === 0 ? "Create your first personalized AI meal plan." : "Try changing your search."}</p>
            {viewMode === "active" && mealPlans.length === 0 && <button onClick={() => setLocation("/meal-planner")} className="mt-6 px-6 py-3 rounded-xl bg-primary text-white font-bold">Create Meal Plan</button>}
          </div>
        )}

        {!loading && sortedMealPlans.length > 0 && (
          <div className="space-y-8">
            {Object.entries(groupedMealPlans).map(([dateKey, group]) => (
              <section key={dateKey}>
                <div className="flex items-center gap-3 mb-3"><h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">{group.label}</h2><div className="h-px flex-1 bg-gray-200" /></div>
                <div className="space-y-3">
                  {group.plans.map((plan) => (
                    <div key={plan._id} className={`w-full bg-white rounded-2xl border shadow-sm p-5 transition ${plan.isArchived ? "border-gray-200 opacity-90" : "border-gray-100 hover:border-primary/40 hover:shadow-md"}`}>
                      <div className="flex items-center gap-4">
                        <button onClick={() => setLocation(`/meal-plans/${plan._id}`)} className="min-w-0 flex-1 text-left">
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 shrink-0 rounded-xl bg-green-50 flex items-center justify-center"><Utensils className="w-5 h-5 text-primary" /></div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                                <h2 className="font-black text-lg text-gray-900 truncate">{getPlanTitle(plan)}</h2>
                                <span className="text-sm text-gray-500 flex items-center gap-1 shrink-0"><Clock className="w-4 h-4" />{formatCreatedAt(plan.createdAt)}</span>
                              </div>
                              <p className="text-sm text-gray-500 capitalize mt-1">{plan.duration}-Day Plan{plan.isArchived ? " • Archived" : ""}</p>
                            </div>
                          </div>
                        </button>
                        <div className="flex items-center gap-1 shrink-0">
                          {viewMode === "active" ? (
                            <button type="button" onClick={(event) => handleArchive(event, plan)} disabled={processingPlanId === plan._id} title="Archive meal plan" aria-label={`Archive ${getPlanTitle(plan)}`} className="p-2.5 rounded-xl text-gray-400 hover:text-amber-600 hover:bg-amber-50 disabled:opacity-50 transition"><Archive className="w-5 h-5" /></button>
                          ) : (
                            <button type="button" onClick={(event) => handleRestore(event, plan)} disabled={processingPlanId === plan._id} title="Restore meal plan" aria-label={`Restore ${getPlanTitle(plan)}`} className="p-2.5 rounded-xl text-gray-400 hover:text-primary hover:bg-green-50 disabled:opacity-50 transition"><ArchiveRestore className="w-5 h-5" /></button>
                          )}
                          <button type="button" onClick={(event) => handleDelete(event, plan)} disabled={processingPlanId === plan._id} title="Delete meal plan permanently" aria-label={`Delete ${getPlanTitle(plan)}`} className="p-2.5 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 transition"><Trash2 className="w-5 h-5" /></button>
                        </div>
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
