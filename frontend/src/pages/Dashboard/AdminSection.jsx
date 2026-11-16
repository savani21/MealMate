import { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  Users, ChefHat, ClipboardList, ShoppingBasket, BarChart3,
  FileBarChart, ShieldCheck, RefreshCw, UserPlus, Utensils,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#16a34a", "#0ea5e9", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6"];

export default function AdminSection() {
  const [, setLocation] = useLocation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Please sign in again.");
      const response = await fetch("/api/admin/analytics/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to load dashboard data.");
      setData(result);
    } catch (err) {
      setError(err.message || "Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const stats = data?.stats;
  const charts = data?.charts;
  const activity = [
    ...(data?.recentUsers || []).slice(0, 3).map((user) => ({
      id: `user-${user._id}`,
      icon: UserPlus,
      title: "New user registered",
      detail: `${user.name} · ${user.email}`,
      date: user.createdAt,
    })),
    ...(data?.recentMealPlans || []).slice(0, 3).map((plan) => ({
      id: `plan-${plan._id}`,
      icon: Utensils,
      title: "Meal plan created",
      detail: `${plan.user?.name || "User"} · ${plan.duration}-day ${plan.goal} plan`,
      date: plan.createdAt,
    })),
  ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 5);

  const cards = stats ? [
    { label: "Registered users", value: stats.totalUsers, note: "Standard user accounts", icon: Users },
    { label: "Recipes", value: stats.totalRecipes, note: "Available in catalogue", icon: ChefHat },
    { label: "Meal plans", value: stats.totalMealPlans, note: "Created by users", icon: ClipboardList },
    { label: "Orders", value: stats.totalOrders, note: "Recorded orders", icon: ShoppingBasket },
  ] : [];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-r from-green-950 via-green-800 to-emerald-700 text-white p-6 sm:p-8 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-green-200">MealMate · Administration</p>
            <h1 className="mt-2 text-3xl sm:text-4xl font-black">Platform overview</h1>
            <p className="mt-2 max-w-xl text-sm sm:text-base text-green-100">Monitor platform activity, manage core data and review performance from one dashboard.</p>
            {data?.generatedAt && <p className="mt-3 text-xs text-green-200">Last updated {new Date(data.generatedAt).toLocaleString()}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setLocation("/admin/users")} className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-green-900 hover:bg-green-50">Manage users</button>
            <button onClick={() => setLocation("/admin/reports")} className="rounded-xl border border-white/40 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/10">View reports</button>
            <button onClick={fetchStats} disabled={loading} aria-label="Refresh dashboard" className="rounded-xl border border-white/40 p-2.5 text-white hover:bg-white/10 disabled:opacity-50"><RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} /></button>
          </div>
        </div>
      </section>

      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {loading && !data ? <div className="rounded-2xl bg-white p-8 text-gray-500">Loading dashboard…</div> : stats && charts ? <>
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {cards.map(({ label, value, note, icon: Icon }) => <div key={label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between"><span className="text-sm font-semibold text-gray-500">{label}</span><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50"><Icon className="h-5 w-5 text-primary" /></span></div>
            <p className="mt-3 text-3xl font-black text-gray-900">{Number(value || 0).toLocaleString()}</p>
            <p className="mt-1 text-xs text-gray-400">{note}</p>
          </div>)}
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-5 gap-5">
          <div className="xl:col-span-3 rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm min-w-0">
            <div className="mb-4"><h2 className="font-black text-gray-900 text-lg">User growth</h2><p className="text-xs text-gray-500 mt-1">New standard user registrations over the last six months</p></div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.userGrowth} margin={{ top: 8, right: 12, left: -18, bottom: 2 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="users" name="New users" stroke="#16a34a" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="xl:col-span-2 rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm min-w-0">
            <div className="mb-2"><h2 className="font-black text-gray-900 text-lg">Meal plan goals</h2><p className="text-xs text-gray-500 mt-1">Distribution of user meal plans</p></div>
            <div className="h-64">
              {charts.mealPlanGoals?.length ? <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={charts.mealPlanGoals} dataKey="plans" nameKey="goal" innerRadius={55} outerRadius={88} paddingAngle={3}>
                    {charts.mealPlanGoals.map((entry, index) => <Cell key={entry.goal} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer> : <div className="h-full flex items-center justify-center text-sm text-gray-400">No meal plan data yet.</div>}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-4"><h2 className="font-black text-gray-900">Recent platform activity</h2><span className="text-xs text-gray-400">Latest records</span></div>
            {activity.length ? <div className="space-y-2">{activity.map((item) => { const Icon = item.icon; return <div key={item.id} className="flex items-center gap-3 rounded-xl bg-gray-50 p-3"><span className="h-9 w-9 rounded-lg bg-white flex items-center justify-center shrink-0"><Icon className="h-4 w-4 text-primary" /></span><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-gray-800">{item.title}</p><p className="text-xs text-gray-500 truncate">{item.detail}</p></div><span className="hidden sm:block text-xs text-gray-400">{item.date ? new Date(item.date).toLocaleDateString() : ""}</span></div>; })}</div> : <p className="text-sm text-gray-400 py-6 text-center">No recent activity available.</p>}
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="font-black text-gray-900 mb-4">Quick access</h2>
            <div className="space-y-2">
              <QuickLink icon={Users} label="User management" onClick={() => setLocation("/admin/users")} />
              <QuickLink icon={ChefHat} label="Recipe management" onClick={() => setLocation("/admin/recipes")} />
              <QuickLink icon={BarChart3} label="Analytics" onClick={() => setLocation("/admin/analytics")} />
              <QuickLink icon={FileBarChart} label="Reports & exports" onClick={() => setLocation("/admin/reports")} />
              <QuickLink icon={ShieldCheck} label="Security settings" onClick={() => setLocation("/admin/security")} />
            </div>
          </div>
        </section>
      </> : !error ? <p className="text-sm text-gray-500">No dashboard data available.</p> : null}
    </div>
  );
}

function QuickLink({ icon: Icon, label, onClick }) {
  return <button type="button" onClick={onClick} className="flex w-full items-center gap-3 rounded-xl border border-gray-100 px-3 py-3 text-left text-sm font-semibold text-gray-700 transition hover:border-green-200 hover:bg-green-50 hover:text-primary"><Icon className="h-4 w-4 text-primary" />{label}<span className="ml-auto text-gray-300">→</span></button>;
}
