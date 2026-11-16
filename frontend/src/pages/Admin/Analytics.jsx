import AppNavbar from "@/components/AppNavbar";
import { useCallback, useEffect, useState } from "react";
import {
  Users, ChefHat, ClipboardList, ShoppingBasket, Package, Activity,
  Star, ShoppingCart, RefreshCw, Bell, Utensils, Store, CalendarDays,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const CHART_COLORS = ["#16a34a", "#0ea5e9", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Your session has expired. Please sign in again.");
      const response = await fetch("/api/admin/analytics/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to load analytics.");
      setAnalytics(data);
    } catch (err) {
      setError(err.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const stats = analytics?.stats;
  const charts = analytics?.charts;

  const cards = stats ? [
    { label: "Registered users", value: stats.totalUsers, detail: `${stats.totalAdmins} admins · ${stats.totalAccounts} accounts total`, icon: Users },
    { label: "Recipes", value: stats.totalRecipes, detail: `${stats.aiRecipes} AI · ${stats.manualRecipes} manual`, icon: ChefHat },
    { label: "Meal plans", value: stats.totalMealPlans, detail: `${stats.activeMealPlans} not archived`, icon: ClipboardList },
    { label: "Grocery lists", value: stats.totalGroceryLists, detail: `${stats.totalGroceryItems} items · ${stats.groceryCompletionRate}% checked`, icon: ShoppingBasket },
    { label: "Orders", value: stats.totalOrders, detail: `Total order value: ₹${stats.totalOrderValue.toLocaleString("en-IN")}`, icon: ShoppingCart },
    { label: "Pantry items", value: stats.totalPantryItems, detail: `${stats.expiringPantryItems} expiring in 7 days`, icon: Package },
    { label: "Nutrition logs", value: stats.totalNutritionLogs, detail: `${stats.verifiedNutritionLogs} verified/manual · ${stats.estimatedNutritionLogs} estimated`, icon: Activity },
    { label: "Active store products", value: stats.activeStoreProducts, detail: `${stats.lowStockProducts} low-stock products (≤5)`, icon: Store },
    { label: "Recipe rating", value: stats.totalReviews ? `${stats.averageRecipeRating}/5` : "No ratings", detail: `${stats.totalReviews} reviews · ${stats.fiveStarReviews} five-star`, icon: Star },
    { label: "Unread notifications", value: stats.unreadNotifications, detail: "Across all user accounts", icon: Bell },
  ] : [];

  return (
    <div className="min-h-screen bg-[#f7faf7] dark:bg-slate-950">
      <AppNavbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Admin control center</p>
            <h1 className="text-3xl font-black text-gray-900 dark:text-slate-100 mt-1">MealMate Analytics</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">Live analysis calculated from platform records in MongoDB.</p>
            {analytics?.generatedAt && <p className="text-xs text-gray-400 mt-1">Updated {new Date(analytics.generatedAt).toLocaleString()}</p>}
          </div>
          <button type="button" onClick={fetchStats} disabled={loading} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-semibold disabled:opacity-60">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh data
          </button>
        </div>

        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 text-red-700 p-4">{error}</div>}
        {loading && !analytics ? (
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-8 text-gray-500">Loading platform analytics…</div>
        ) : stats && charts ? (
          <>
            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
              {cards.map(({ label, value, detail, icon: Icon }) => (
                <div key={label} className="rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 p-5 shadow-sm min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-gray-500 dark:text-slate-400">{label}</p>
                    <span className="w-9 h-9 rounded-xl bg-green-50 dark:bg-green-950/50 flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-primary" /></span>
                  </div>
                  <p className="text-2xl font-black text-gray-900 dark:text-slate-100 mt-3 break-words">{value}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">{detail}</p>
                </div>
              ))}
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <ChartPanel title="User growth · last 6 months" subtitle="New standard user accounts by month">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={charts.userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" /><YAxis allowDecimals={false} />
                    <Tooltip /><Line type="monotone" dataKey="users" name="New users" stroke="#16a34a" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartPanel>
              <ChartPanel title="Recipe categories" subtitle="Recipe catalogue distribution">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.recipeCategories} layout="vertical" margin={{ left: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" /><XAxis type="number" allowDecimals={false} /><YAxis type="category" dataKey="category" width={100} /><Tooltip />
                    <Bar dataKey="recipes" name="Recipes" fill="#0ea5e9" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartPanel>
              <ChartPanel title="Meal plan goals" subtitle="What users are planning for">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={charts.mealPlanGoals} dataKey="plans" nameKey="goal" outerRadius={105} label>
                    {charts.mealPlanGoals.map((entry, index) => <Cell key={entry.goal} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                  </Pie><Tooltip /><Legend /></PieChart>
                </ResponsiveContainer>
              </ChartPanel>
              <ChartPanel title="Meal plan diet preferences" subtitle="Distribution of saved meal plans">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={charts.mealPlanDiets} dataKey="plans" nameKey="diet" outerRadius={105} label>
                    {charts.mealPlanDiets.map((entry, index) => <Cell key={entry.diet} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                  </Pie><Tooltip /><Legend /></PieChart>
                </ResponsiveContainer>
              </ChartPanel>
              <ChartPanel title="Order status" subtitle="Current order lifecycle totals">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.orderStatuses}>
                    <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="status" /><YAxis allowDecimals={false} /><Tooltip />
                    <Bar dataKey="orders" name="Orders" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartPanel>
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 p-6">
                <h2 className="font-black text-gray-900 dark:text-slate-100">Operational indicators</h2>
                <div className="mt-5 space-y-4">
                  <ProgressMetric label="Grocery checklist completion" value={stats.groceryCompletionRate} suffix="%" />
                  <ProgressMetric label="Five-star share of reviews" value={stats.totalReviews ? Math.round(stats.fiveStarReviews / stats.totalReviews * 100) : 0} suffix="%" />
                  <div className="flex justify-between text-sm"><span className="text-gray-500 dark:text-slate-400">Average calories per logged meal</span><strong className="text-gray-900 dark:text-slate-100">{stats.averageCaloriesPerLoggedMeal} kcal</strong></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500 dark:text-slate-400">Average order value</span><strong className="text-gray-900 dark:text-slate-100">₹{stats.averageOrderValue.toLocaleString("en-IN")}</strong></div>
                  <p className="text-xs text-gray-400">Order value is based on placed order records; it is not verified payment revenue.</p>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <DataList title="Recently joined users" empty="No registered users yet." items={analytics.recentUsers} render={(u) => <><span className="font-semibold text-gray-800 dark:text-slate-200">{u.name}</span><span className="text-xs text-gray-500 dark:text-slate-400">{u.email} · {u.role} · {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}</span></>} />
              <DataList title="Recently created meal plans" empty="No meal plans yet." items={analytics.recentMealPlans} render={(plan) => <><span className="font-semibold text-gray-800 dark:text-slate-200">{plan.user?.name || "Unknown user"} · {plan.goal}</span><span className="text-xs text-gray-500 dark:text-slate-400">{plan.duration} days · {plan.diet} · {new Date(plan.createdAt).toLocaleDateString()}</span></>} />
            </section>
          </>
        ) : !error ? <p className="text-gray-500">No analytics data available.</p> : null}
      </main>
    </div>
  );
}

function ChartPanel({ title, subtitle, children }) {
  return <section className="rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 p-5 sm:p-6 min-w-0">
    <h2 className="font-black text-gray-900 dark:text-slate-100">{title}</h2>
    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 mb-4">{subtitle}</p>
    <div className="h-64 min-w-0">{children}</div>
  </section>;
}

function ProgressMetric({ label, value, suffix }) {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0));
  return <div>
    <div className="flex justify-between gap-3 text-sm mb-2"><span className="text-gray-500 dark:text-slate-400">{label}</span><strong className="text-gray-900 dark:text-slate-100">{value}{suffix}</strong></div>
    <div className="h-2 rounded-full bg-gray-100 dark:bg-slate-800 overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: `${safeValue}%` }} /></div>
  </div>;
}

function DataList({ title, empty, items, render }) {
  return <section className="rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 p-6">
    <h2 className="font-black text-gray-900 dark:text-slate-100 mb-4">{title}</h2>
    {items?.length ? <div className="space-y-3">{items.map((item) => <div key={item._id} className="flex flex-col gap-1 rounded-xl bg-gray-50 dark:bg-slate-800 p-3">{render(item)}</div>)}</div> : <p className="text-sm text-gray-500">{empty}</p>}
  </section>;
}
