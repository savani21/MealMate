import AppNavbar from "@/components/AppNavbar";
import PageHeroBanner from "@/components/PageHeroBanner";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, Beef, Flame, Droplets, Wheat, Target, Pencil, Trash2, CalendarDays, RefreshCw } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const API = "http://localhost:5000/api/nutrition";
const COLORS = ["#16a34a", "#e5a33b", "#3b82f6", "#ec6b78"];
const EMPTY_TOTALS = { calories: 0, protein: 0, carbohydrates: 0, fat: 0 };
const DEFAULT_GOALS = { calories: 2000, protein: 75, carbohydrates: 250, fat: 65 };

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function prettyDate(dateKey) {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function round(value) {
  return Math.round((Number(value) || 0) * 10) / 10;
}

function ProgressCard({ title, value, goal, unit, icon: Icon, color, description }) {
  const percent = goal > 0 ? Math.min(100, (value / goal) * 100) : 0;
  const remaining = Math.max(0, goal - value);
  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}><Icon className="h-5 w-5" /></div>
        <span className="text-xs font-semibold text-gray-400">{Math.round(percent)}% of goal</span>
      </div>
      <p className="mt-4 text-sm font-semibold text-gray-500">{title}</p>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-2xl font-black tracking-tight text-gray-900">{round(value).toLocaleString()}</span>
        <span className="text-xs font-medium text-gray-400">{unit}</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-current transition-all" style={{ width: `${percent}%`, color: "inherit", backgroundColor: color.includes("green") ? "#16a34a" : color.includes("blue") ? "#3b82f6" : color.includes("amber") ? "#d99a24" : "#db7182" }} />
      </div>
      <p className="mt-2 text-xs text-gray-400">{remaining > 0 ? `${round(remaining)} ${unit} remaining` : "Daily target reached"}</p>
      {description && <p className="mt-1 text-[11px] text-gray-400">{description}</p>}
    </article>
  );
}

export default function NutritionDashboard() {
  const [dateKey, setDateKey] = useState(localDateKey());
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingGoals, setEditingGoals] = useState(false);
  const [goals, setGoals] = useState(DEFAULT_GOALS);
  const [savingGoals, setSavingGoals] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [todayPlan, setTodayPlan] = useState(null);
  const [checkinMeals, setCheckinMeals] = useState([]);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [checkinSaving, setCheckinSaving] = useState(false);
  const [checkinMessage, setCheckinMessage] = useState("");
  const [reminders, setReminders] = useState({ enabled: false, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata", breakfast: "08:00", lunch: "13:00", dinner: "19:00" });
  const [savingReminders, setSavingReminders] = useState(false);
  const [reminderMessage, setReminderMessage] = useState("");

  useEffect(() => {
    const targetId = window.location.hash.slice(1);
    if (!targetId) return;
    const target = document.getElementById(targetId);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [dateKey]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Please sign in to view your nutrition dashboard.");
      const response = await fetch(`${API}/dashboard?dateKey=${dateKey}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not load nutrition data.");
      setDashboard(data);
      setGoals(data.goals || DEFAULT_GOALS);
      const reminderResponse = await fetch(`${API}/reminders`, { headers: { Authorization: `Bearer ${token}` } });
      const reminderData = await reminderResponse.json();
      if (reminderResponse.ok && reminderData.preferences) setReminders((current) => ({ ...current, ...reminderData.preferences }));
      const planResponse = await fetch(`${API}/today-plan?dateKey=${dateKey}`, { headers: { Authorization: `Bearer ${token}` } });
      const planData = await planResponse.json();
      if (planResponse.ok && planData.plan && planData.day) {
        setTodayPlan({ ...planData.plan, dayNumber: planData.day.dayNumber, meals: planData.day.meals || [] });
        const existing = planData.day.logs || [];
        setCheckinMeals((planData.day.meals || []).map((meal) => {
          const log = existing.find((item) => item.mealType === meal.mealType && item.mealName === meal.name);
          return { ...meal, eaten: Boolean(log), servings: String(log?.servings || 1) };
        }));
      } else {
        setTodayPlan(null);
        setCheckinMeals([]);
      }
    } catch (err) {
      setError(err.message || "Unable to connect to MealMate.");
    } finally {
      setLoading(false);
    }
  }, [dateKey]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const totals = dashboard?.today?.totals || EMPTY_TOTALS;
  const meals = dashboard?.today?.meals || [];
  const weekly = dashboard?.weekly || [];
  const macroData = [
    { name: "Protein", value: round(totals.protein) },
    { name: "Carbs", value: round(totals.carbohydrates) },
    { name: "Fat", value: round(totals.fat) },
  ].filter((item) => item.value > 0);

  const weeklyAverage = useMemo(() => {
    if (!weekly.length) return 0;
    return Math.round(weekly.reduce((sum, day) => sum + day.calories, 0) / 7);
  }, [weekly]);

  const saveGoals = async (event) => {
    event.preventDefault();
    setSavingGoals(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API}/goals`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(Object.fromEntries(Object.entries(goals).map(([key, value]) => [key, Number(value)]))),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not save goals.");
      setGoals(data.goals);
      setEditingGoals(false);
      await loadDashboard();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingGoals(false);
    }
  };

  const saveReminders = async (event) => {
    event.preventDefault();
    setSavingReminders(true);
    setReminderMessage("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API}/reminders`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(reminders),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not save reminders.");
      setReminders((current) => ({ ...current, ...data.preferences }));
      setReminderMessage(reminders.enabled ? "Meal reminders are enabled." : "Meal reminders are turned off.");
    } catch (err) { setReminderMessage(err.message); }
    finally { setSavingReminders(false); }
  };

  const updateCheckinMeal = (mealType, patch) => {
    setCheckinMeals((current) => current.map((meal) => meal.mealType === mealType ? { ...meal, ...patch } : meal));
  };

  const saveDailyCheckin = async () => {
    if (!todayPlan?._id) return;
    setCheckinSaving(true);
    setCheckinMessage("");
    try {
      const token = localStorage.getItem("token");
      const entries = checkinMeals.filter((meal) => meal.eaten).map((meal) => ({
        mealType: meal.mealType, mealName: meal.name, servings: Number(meal.servings),
      }));
      const response = await fetch(`${API}/daily-checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mealPlanId: todayPlan._id, dayNumber: todayPlan.dayNumber, dateKey, entries }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not save your daily check-in.");
      setCheckinMessage("Today's food intake has been updated.");
      await loadDashboard();
    } catch (err) {
      setCheckinMessage(err.message || "Could not save your check-in.");
    } finally {
      setCheckinSaving(false);
    }
  };

  const removeMeal = async (id) => {
    if (!window.confirm("Remove this meal from your nutrition log?")) return;
    setDeletingId(id);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API}/logs/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not remove meal.");
      await loadDashboard();
    } catch (err) { setError(err.message); }
    finally { setDeletingId(""); }
  };

  return (
    <div className="min-h-screen bg-[#f7faf7]">
      <AppNavbar />
      <PageHeroBanner title="Nutrition Dashboard" description="Understand your daily intake and build healthier meal habits." eyebrow="YOUR WELLNESS OVERVIEW" icon={Activity} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div id="nutrition-overview" className="mb-7 scroll-mt-24 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-sm font-semibold text-primary">Daily nutrition</p><h1 className="mt-1 text-2xl font-black text-gray-900">Your nutrition at a glance</h1><p className="mt-1 text-sm text-gray-500">Only meals you mark as eaten are included in these totals.</p></div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700"><CalendarDays className="h-4 w-4 text-primary" /><input type="date" value={dateKey} max={localDateKey()} onChange={(event) => setDateKey(event.target.value)} className="bg-transparent outline-none" /></label>
            <button type="button" onClick={loadDashboard} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-600 hover:border-primary hover:text-primary"><RefreshCw className="h-4 w-4" />Refresh</button>
            <button type="button" onClick={() => setEditingGoals((value) => !value)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:opacity-90"><Pencil className="h-4 w-4" />Edit goals</button>
          </div>
        </div>

        {error && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {dateKey === localDateKey() && <section id="daily-checkin" className="mb-6 scroll-mt-24 rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div><p className="text-xs font-bold uppercase tracking-wider text-primary">Daily check-in</p><h2 className="mt-1 text-xl font-black text-gray-900">How did you eat today?</h2><p className="mt-1 text-sm text-gray-500">Confirm your meals together. Planned meals are not counted until you say you ate them.</p></div>
            {todayPlan && <span className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-bold text-primary">Latest active AI plan</span>}
          </div>
          {!todayPlan ? <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-600">No active meal plan found. Generate a meal plan to start a daily check-in.</div> : <>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {checkinMeals.map((meal) => <article key={meal.mealType} className="rounded-xl border border-gray-100 p-4">
                <div className="flex items-center justify-between gap-2"><span className="text-xs font-bold uppercase tracking-wide text-primary">{meal.mealType}</span><label className="flex items-center gap-2 text-xs font-semibold text-gray-600"><input type="checkbox" checked={meal.eaten} onChange={(event) => updateCheckinMeal(meal.mealType, { eaten: event.target.checked })} className="h-4 w-4 accent-green-600"/> Ate this</label></div>
                <h3 className="mt-2 text-sm font-bold text-gray-900">{meal.name}</h3>
                {meal.eaten && <label className="mt-3 block text-xs font-semibold text-gray-600">Servings eaten<input type="number" min="0.25" max="20" step="0.25" value={meal.servings} onChange={(event) => updateCheckinMeal(meal.mealType, { servings: event.target.value })} className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"/></label>}
                {meal.eaten && meal.nutrition && <p className="mt-2 text-[11px] text-gray-500">{Math.round(Number(meal.nutrition.calories) * Number(meal.servings || 1))} kcal estimated for this serving amount</p>}
                {meal.eaten && (!meal.nutrition || meal.nutrition.status === "unavailable") && <p className="mt-2 text-[11px] text-amber-700">Nutrition needs review before this meal can be added.</p>}
              </article>)}
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className={`text-xs ${checkinMessage.toLowerCase().includes("could not") || checkinMessage.toLowerCase().includes("not ready") ? "text-amber-700" : "text-gray-500"}`}>{checkinMessage || "You can change these answers later. Only confirmed meals count toward your totals."}</p>
              <button type="button" onClick={saveDailyCheckin} disabled={checkinSaving || !checkinMeals.length} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{checkinSaving ? "Saving..." : "Save today's check-in"}</button>
            </div>
          </>}
        </section>}

        <section className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <form onSubmit={saveReminders}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div><h2 className="font-black text-gray-900">Meal reminders</h2><p className="mt-1 text-xs text-gray-500">Get an in-app reminder when it is time to check in. Reminders are created while the MealMate backend is running.</p></div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><input type="checkbox" checked={Boolean(reminders.enabled)} onChange={(event) => setReminders((current) => ({ ...current, enabled: event.target.checked }))} className="h-4 w-4 accent-green-600"/> Enable reminders</label>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {["breakfast", "lunch", "dinner"].map((meal) => <label key={meal} className="text-xs font-semibold capitalize text-gray-600">{meal} reminder<input type="time" value={reminders[meal] || "08:00"} onChange={(event) => setReminders((current) => ({ ...current, [meal]: event.target.value }))} className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900"/></label>)}
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-gray-500">{reminderMessage || `Timezone: ${reminders.timezone || "Asia/Kolkata"}`}</p><button disabled={savingReminders} className="rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm font-bold text-primary disabled:opacity-50">{savingReminders ? "Saving..." : "Save reminder settings"}</button></div>
          </form>
        </section>

        {editingGoals && <form onSubmit={saveGoals} className="mb-6 rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
          <div className="mb-4"><h2 className="font-bold text-gray-900">Personal daily targets</h2><p className="mt-1 text-xs text-gray-500">These are tracking targets, not medical advice. Adjust them to goals set with a qualified professional.</p></div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ["calories", "Calories", "kcal"], ["protein", "Protein", "g"],
              ["carbohydrates", "Carbohydrates", "g"], ["fat", "Fat", "g"],
            ].map(([key, label, unit]) => <label key={key} className="text-xs font-semibold text-gray-600">{label} ({unit})<input type="number" min={key === "calories" ? "500" : "0"} max={key === "calories" ? "10000" : key === "protein" || key === "fat" ? "500" : "1000"} step="1" required value={goals[key]} onChange={(event) => setGoals((current) => ({ ...current, [key]: event.target.value }))} className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-primary" /></label>)}
          </div>
          <div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => setEditingGoals(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600">Cancel</button><button disabled={savingGoals} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{savingGoals ? "Saving..." : "Save targets"}</button></div>
        </form>}

        {loading ? <div className="rounded-2xl border border-gray-100 bg-white py-20 text-center text-sm text-gray-500">Loading your nutrition data...</div> : <>
          <section className="mb-6 rounded-2xl border border-green-100 bg-green-50/70 p-4 sm:p-5">
            <div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary"><Activity className="h-5 w-5"/></div><div><h2 className="font-bold text-gray-900">MealMate daily insight</h2><p className="mt-1 text-sm text-gray-700">{totals.calories === 0 ? "Start with your daily check-in to see nutrition insights based on meals you actually ate." : totals.protein < goals.protein * 0.5 ? "Your recorded protein is still below half of your daily target. Consider a protein-rich option in your next meal." : totals.calories > goals.calories ? "Your recorded calories are above today's tracking target. Review your portions and overall weekly pattern rather than judging one day." : "Your nutrition is being tracked from confirmed meals. Keep logging your intake to build a more useful weekly picture."}</p><p className="mt-1 text-[11px] text-gray-500">General wellness guidance only; targets are personal tracking references, not medical advice.</p></div></div>
          </section>

          <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <ProgressCard title="Calories consumed" value={totals.calories} goal={goals.calories} unit="kcal" icon={Flame} color="bg-orange-50 text-orange-600" />
            <ProgressCard title="Protein" value={totals.protein} goal={goals.protein} unit="g" icon={Beef} color="bg-blue-50 text-blue-600" />
            <ProgressCard title="Carbohydrates" value={totals.carbohydrates} goal={goals.carbohydrates} unit="g" icon={Wheat} color="bg-amber-50 text-amber-600" />
            <ProgressCard title="Fat" value={totals.fat} goal={goals.fat} unit="g" icon={Droplets} color="bg-rose-50 text-rose-600" />
          </section>

          <section className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
            <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-2">
              <div className="flex items-start justify-between"><div><h2 className="font-black text-gray-900">Weekly calorie trend</h2><p className="mt-1 text-xs text-gray-500">Recorded meals over the last seven days</p></div><span className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-bold text-primary">Avg. {weeklyAverage.toLocaleString()} kcal/day</span></div>
              <div className="mt-5 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekly} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf1ed" />
                    <XAxis dataKey="dateKey" tickFormatter={(value) => new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { weekday: "short" })} axisLine={false} tickLine={false} tick={{ fill: "#89938a", fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#89938a", fontSize: 11 }} />
                    <Tooltip labelFormatter={(value) => prettyDate(value)} formatter={(value) => [`${Math.round(value)} kcal`, "Calories"]} />
                    <Bar dataKey="calories" fill="#24945b" radius={[7, 7, 0, 0]} maxBarSize={42} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>
            <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="font-black text-gray-900">Today's macros</h2><p className="mt-1 text-xs text-gray-500">Protein, carbohydrates and fat</p>
              {macroData.length ? <div className="mt-2 h-56"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={macroData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={82} paddingAngle={4}>{macroData.map((item, index) => <Cell key={item.name} fill={COLORS[index]} />)}</Pie><Tooltip formatter={(value) => [`${value} g`, ""]} /><Legend verticalAlign="bottom" height={30} /></PieChart></ResponsiveContainer></div> : <div className="flex h-56 flex-col items-center justify-center text-center"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-primary"><Target className="h-6 w-6" /></div><p className="mt-3 text-sm font-semibold text-gray-700">No macro data yet</p><p className="mt-1 max-w-[210px] text-xs text-gray-400">Log an eaten meal to see your macro distribution.</p></div>}
            </article>
          </section>

          <section className="grid grid-cols-1 gap-5 lg:grid-cols-5">
            <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-3">
              <div className="flex items-center justify-between gap-3"><div><h2 className="font-black text-gray-900">Meals recorded</h2><p className="mt-1 text-xs text-gray-500">{prettyDate(dateKey)} · {meals.length} meal{meals.length === 1 ? "" : "s"} logged</p></div><span className="rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-500">{round(totals.calories)} kcal total</span></div>
              <div className="mt-4 space-y-3">
                {meals.length ? meals.map((meal) => <div key={meal._id} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-primary"><Activity className="h-5 w-5" /></div>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold capitalize text-gray-900">{meal.mealName}</p><p className="mt-0.5 text-xs capitalize text-gray-500">{meal.mealType} · {meal.servings} serving(s)</p><p className="mt-1 text-[11px] text-gray-400">{Math.round(meal.calories)} kcal · {round(meal.protein)}g protein · {round(meal.carbohydrates)}g carbs · {round(meal.fat)}g fat</p></div>
                  <button type="button" onClick={() => removeMeal(meal._id)} disabled={deletingId === meal._id} aria-label={`Remove ${meal.mealName}`} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"><Trash2 className="h-4 w-4" /></button>
                </div>) : <div className="rounded-xl border border-dashed border-gray-200 px-4 py-10 text-center"><p className="text-sm font-semibold text-gray-700">No meals recorded for this date</p><p className="mt-1 text-xs text-gray-400">Open one of your meal plans and mark a meal as eaten to start tracking.</p><a href="/my-meal-plans" className="mt-3 inline-flex rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white">Open my meal plans</a></div>}
              </div>
            </article>
            <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-2">
              <h2 className="font-black text-gray-900">Tracking tips</h2><p className="mt-1 text-xs text-gray-500">Make your nutrition history more useful</p>
              <div className="mt-4 space-y-4">
                <div className="flex gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-50 text-primary"><Target className="h-4 w-4" /></span><div><p className="text-sm font-bold text-gray-800">Set realistic targets</p><p className="mt-1 text-xs leading-5 text-gray-500">Use Edit goals to set targets that suit your needs.</p></div></div>
                <div className="flex gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600"><Flame className="h-4 w-4" /></span><div><p className="text-sm font-bold text-gray-800">Log meals when eaten</p><p className="mt-1 text-xs leading-5 text-gray-500">Planned meals are not counted until you confirm that you ate them.</p></div></div>
                <div className="flex gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Activity className="h-4 w-4" /></span><div><p className="text-sm font-bold text-gray-800">Use accurate nutrition values</p><p className="mt-1 text-xs leading-5 text-gray-500">Enter values from a trusted food label or nutrition source. MealMate does not invent missing nutrition data.</p></div></div>
              </div>
            </article>
          </section>
        </>}
      </main>
    </div>
  );
}
