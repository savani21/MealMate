import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChefHat,
  Heart,
  ArrowRight,
  Sparkles,
  ClipboardList,
  Clock,
  MessageCircle,
  Utensils,
  CheckCircle2,
  Activity,
  Flame,
  Star,
} from "lucide-react";

import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";

const MEAL_TIMES = {
  breakfast: { label: "Breakfast", time: "8:00 AM", minutes: 8 * 60 },
  lunch: { label: "Lunch", time: "1:00 PM", minutes: 13 * 60 },
  dinner: { label: "Dinner", time: "7:00 PM", minutes: 19 * 60 },
};

const mealOrder = ["breakfast", "lunch", "dinner"];

function getPlanDayForToday(plan, now = new Date()) {
  if (!plan?.createdAt || !Array.isArray(plan.meals)) return null;

  const start = new Date(plan.createdAt);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const difference = Math.floor((today - startDay) / 86400000);

  if (difference < 0 || difference >= Number(plan.duration)) return null;
  return plan.meals[difference] || null;
}

function getMealStatus(mealKey, now = new Date()) {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const start = MEAL_TIMES[mealKey].minutes;
  const nextIndex = mealOrder.indexOf(mealKey) + 1;
  const nextMeal = mealOrder[nextIndex];
  const end = nextMeal ? MEAL_TIMES[nextMeal].minutes : 22 * 60;

  if (currentMinutes >= start && currentMinutes < end) return "current";
  if (currentMinutes < start) return "upcoming";
  return "past";
}

function getLocalDateKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getPlanDates(plan) {
  if (!plan?.createdAt || !Number(plan.duration)) return [];
  const start = new Date(plan.createdAt);
  const dates = [];

  for (let index = 0; index < Number(plan.duration); index += 1) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
    dates.push(getLocalDateKey(date));
  }

  return dates;
}

export default function UserSection() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [mealPlans, setMealPlans] = useState([]);
  const [now, setNow] = useState(new Date());
  const [loadingMeals, setLoadingMeals] = useState(true);
  const [nutritionData, setNutritionData] = useState(null);
  const [loadingNutrition, setLoadingNutrition] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadTodayMeals = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch("http://localhost:5000/api/meal-plans", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Failed to load meal plans");
        const data = await response.json();
        setMealPlans(data.mealPlans || []);
      } catch (error) {
        console.error("Today's meals error:", error);
      } finally {
        setLoadingMeals(false);
      }
    };

    loadTodayMeals();
  }, [user]);

  const todayDateKey = getLocalDateKey(now);

  useEffect(() => {
    let cancelled = false;
    const loadNutritionSummary = async () => {
      setLoadingNutrition(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const response = await fetch(`http://localhost:5000/api/nutrition/dashboard?dateKey=${todayDateKey}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Could not load nutrition summary.");
        const data = await response.json();
        if (!cancelled) setNutritionData(data);
      } catch (error) {
        console.error("Dashboard nutrition summary error:", error);
        if (!cancelled) setNutritionData(null);
      } finally {
        if (!cancelled) setLoadingNutrition(false);
      }
    };
    loadNutritionSummary();
    return () => { cancelled = true; };
  }, [user, todayDateKey]);

  const activeMealPlans = useMemo(
    () => mealPlans.filter((plan) => !plan.isArchived),
    [mealPlans]
  );

  const todayPlan = useMemo(() => {
    return activeMealPlans
      .filter((plan) => getPlanDayForToday(plan, now))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null;
  }, [activeMealPlans, now]);

  const todayMeals = useMemo(() => {
    if (!todayPlan) return null;
    return getPlanDayForToday(todayPlan, now);
  }, [todayPlan, now]);

  const todayLabel = now.toLocaleDateString([], {
    weekday: "long",
    day: "numeric",
    month: "short",
  });

  const completedMealCount = todayMeals
    ? mealOrder.filter((mealKey) => getMealStatus(mealKey, now) === "past").length
    : 0;

  const currentMeal = mealOrder.find((mealKey) => getMealStatus(mealKey, now) === "current");
  const nextMeal = mealOrder.find((mealKey) => getMealStatus(mealKey, now) === "upcoming");

  const weeklySummary = useMemo(() => {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    const day = weekStart.getDay();
    weekStart.setDate(weekStart.getDate() - day);

    const weekKeys = new Set();
    let plannedMeals = 0;

    activeMealPlans.forEach((plan) => {
      const planDates = getPlanDates(plan);
      planDates.forEach((dateKey) => {
        const date = new Date(`${dateKey}T00:00:00`);
        const diff = Math.floor((date - weekStart) / 86400000);
        if (diff >= 0 && diff < 7) {
          weekKeys.add(dateKey);
          const planDayIndex = planDates.indexOf(dateKey);
          const dayMeals = Array.isArray(plan.meals) ? plan.meals[planDayIndex] : null;
          if (dayMeals) {
            plannedMeals += mealOrder.filter(
              (mealKey) => typeof dayMeals[mealKey] === "string" && dayMeals[mealKey].trim()
            ).length;
          }
        }
      });
    });

    return {
      plannedDays: weekKeys.size,
      plannedMeals,
      activePlans: activeMealPlans.length,
    };
  }, [activeMealPlans, now]);

  const recentActivity = useMemo(() => {
    return [...activeMealPlans]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 4)
      .map((plan) => ({
        title: `Created ${plan.duration}-day meal plan`,
        date: new Date(plan.createdAt).toLocaleDateString([], {
          day: "numeric",
          month: "short",
        }),
        time: new Date(plan.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        id: plan._id,
      }));
  }, [activeMealPlans]);

  return (
    <div className="space-y-8">
      <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-green-50 border-b border-green-100 px-7 py-6 md:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-primary font-bold text-sm uppercase tracking-wide">Today's Meal Plan</p>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 mt-1">Your healthy routine for today</h1>
            <p className="text-sm text-gray-600 mt-1">{todayLabel}</p>
          </div>
          {todayPlan && (
            <button onClick={() => setLocation(`/meal-plans/${todayPlan._id}`)} className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-white font-semibold hover:opacity-90 transition">
              View Today's Plan <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {loadingMeals ? (
          <div className="p-10 text-center text-gray-500">Loading today's meals...</div>
        ) : !todayPlan ? (
          <div className="p-10 text-center">
            <CalendarDays className="w-10 h-10 text-primary mx-auto" />
            <h2 className="font-bold text-gray-900 mt-3">No meal planned for today</h2>
            <p className="text-sm text-gray-500 mt-1">Create a 1, 3 or 7-day plan to start today's routine.</p>
            <button onClick={() => setLocation("/meal-planner")} className="mt-5 px-5 py-2.5 rounded-xl bg-primary text-white font-semibold">
              Generate Today's Meal
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6 md:p-7">
              {mealOrder.map((mealKey) => {
                const mealInfo = MEAL_TIMES[mealKey];
                return <MealCard key={mealKey} type={mealInfo.label} time={mealInfo.time} meal={todayMeals?.[mealKey] || "Meal not available"} status={getMealStatus(mealKey, now)} />;
              })}
            </div>
            <div className="px-6 pb-6 md:px-7 md:pb-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <RoutineStat icon={<CheckCircle2 className="w-5 h-5" />} value={`${completedMealCount}/3`} label="Meals completed by time" />
              <RoutineStat icon={<Clock className="w-5 h-5" />} value={currentMeal ? MEAL_TIMES[currentMeal].label : nextMeal ? MEAL_TIMES[nextMeal].label : "Complete"} label={currentMeal ? "Meal happening now" : nextMeal ? "Next meal" : "Today's routine"} />
              <RoutineStat icon={<Utensils className="w-5 h-5" />} value={`${todayPlan.duration} day`} label="Current plan" />
            </div>
            <div className="px-6 pb-6 md:px-7 md:pb-7">
              <button onClick={() => setLocation("/nutrition")} className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-green-100 bg-green-50 px-5 py-4 text-left hover:border-primary transition">
                <div><p className="font-bold text-gray-900">Today's Nutrition Check-in</p><p className="mt-1 text-sm text-gray-600">Confirm breakfast, lunch and dinner together and adjust servings in one place.</p></div>
                <span className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white">Update today's intake <ArrowRight className="h-4 w-4"/></span>
              </button>
            </div>
          </>
        )}
      </section>

      <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between md:px-7">
          <div>
            <p className="text-primary text-xs font-bold uppercase tracking-wider">Nutrition tracking</p>
            <h2 className="mt-1 text-xl font-black text-gray-900">Today's nutrition</h2>
            <p className="mt-1 text-sm text-gray-500">Your progress from meals you have confirmed eating</p>
          </div>
          <button onClick={() => setLocation("/nutrition")} className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-bold text-primary hover:bg-green-100 transition">
            Full nutrition dashboard <ArrowRight className="h-4 w-4"/>
          </button>
        </div>
        {loadingNutrition ? (
          <div className="p-7 text-center text-sm text-gray-500">Loading your nutrition progress...</div>
        ) : (
          <div className="p-6 md:p-7">
            {(() => {
              const totals = nutritionData?.today?.totals || { calories: 0, protein: 0, carbohydrates: 0, fat: 0 };
              const goals = nutritionData?.goals || { calories: 2000, protein: 75, carbohydrates: 250, fat: 65 };
              const nutrients = [
                { key: "protein", label: "Protein", unit: "g", color: "bg-blue-500", track: "bg-blue-50" },
                { key: "carbohydrates", label: "Carbs", unit: "g", color: "bg-amber-500", track: "bg-amber-50" },
                { key: "fat", label: "Fat", unit: "g", color: "bg-rose-500", track: "bg-rose-50" },
              ];
              const calories = Number(totals.calories) || 0;
              const calorieGoal = Number(goals.calories) || 2000;
              const caloriePercent = Math.min(100, Math.round((calories / calorieGoal) * 100));
              const hasEntries = (nutritionData?.today?.meals || []).length > 0;
              return <>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.05fr_2fr]">
                  <div className="rounded-2xl bg-green-50 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary"><Flame className="h-5 w-5"/></div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-primary">{caloriePercent}% of goal</span>
                    </div>
                    <p className="mt-4 text-sm font-semibold text-gray-600">Calories consumed</p>
                    <div className="mt-1 flex items-baseline gap-2"><span className="text-3xl font-black tabular-nums text-gray-900">{Math.round(calories).toLocaleString()}</span><span className="text-sm text-gray-500">/ {calorieGoal.toLocaleString()} kcal</span></div>
                    <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${caloriePercent}%` }}/></div>
                    <p className="mt-2 text-xs text-gray-600">{Math.max(0, Math.round(calorieGoal - calories)).toLocaleString()} kcal remaining</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {nutrients.map((nutrient) => {
                      const value = Number(totals[nutrient.key]) || 0;
                      const goal = Number(goals[nutrient.key]) || 0;
                      const percent = goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0;
                      return <div key={nutrient.key} className="rounded-2xl border border-gray-100 p-4">
                        <div className="flex items-center justify-between gap-2"><span className="text-sm font-bold text-gray-700">{nutrient.label}</span><span className="text-xs font-bold tabular-nums text-gray-500">{percent}%</span></div>
                        <p className="mt-3 text-2xl font-black tabular-nums text-gray-900">{Math.round(value * 10) / 10}<span className="ml-1 text-xs font-semibold text-gray-400">{nutrient.unit}</span></p>
                        <p className="mt-1 text-xs text-gray-500">of {goal} {nutrient.unit}</p>
                        <div className={`mt-3 h-2 overflow-hidden rounded-full ${nutrient.track}`}><div className={`h-full rounded-full ${nutrient.color} transition-all`} style={{ width: `${percent}%` }}/></div>
                      </div>;
                    })}
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-2 rounded-xl border border-dashed border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-gray-500">{hasEntries ? `${nutritionData.today.meals.length} confirmed meal entries counted today.` : "No confirmed meals logged yet. Planned meals are not included in these totals."}</p>
                  <button onClick={() => setLocation("/nutrition")} className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">Log or update food <ArrowRight className="h-3.5 w-3.5"/></button>
                </div>
              </>;
            })()}
          </div>
        )}
      </section>

      <section>
        <div className="mb-5">
          <p className="text-primary font-semibold text-sm uppercase tracking-wide">Quick Access</p>
          <h2 className="text-2xl font-black text-gray-900 mt-1">Manage your meals</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <ActionCard icon={<CalendarDays className="w-6 h-6 text-primary" />} title="Meal Planner" description="Create a new personalized plan." onClick={() => setLocation("/meal-planner")} />
          <ActionCard icon={<ClipboardList className="w-6 h-6 text-primary" />} title="My Meal Plans" description="Compare and manage saved plans." onClick={() => setLocation("/my-meal-plans")} />
          <ActionCard icon={<Heart className="w-6 h-6 text-primary" />} title="Favorites" description="Open your saved recipes." onClick={() => setLocation("/favorites")} />
          <ActionCard icon={<ChefHat className="w-6 h-6 text-primary" />} title="Recipes" description="Browse and generate recipes." onClick={() => setLocation("/recipes")} />
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-primary font-semibold text-sm uppercase tracking-wide">This Week</p>
            <h2 className="text-2xl font-black text-gray-900 mt-1">Your meal activity</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <SummaryCard icon={<CalendarDays className="w-5 h-5" />} value={`${weeklySummary.plannedDays}/7`} label="Days with meals planned" />
          <SummaryCard icon={<Utensils className="w-5 h-5" />} value={weeklySummary.plannedMeals} label="Meals planned this week" />
          <SummaryCard icon={<Flame className="w-5 h-5" />} value={weeklySummary.activePlans} label="Active meal plans" />
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <FeaturePanel icon={<Star className="w-6 h-6 text-primary" />} label="Favorites" title="Your saved recipes" description="Jump back to recipes you have saved for quick access." button="View Favorites" onClick={() => setLocation("/favorites")} />
        <FeaturePanel icon={<MessageCircle className="w-6 h-6 text-primary" />} label="MealMate AI" title="Ask your meal assistant" description="Get help with meal ideas, ingredients and healthy food choices." button="Open Assistant" onClick={() => window.dispatchEvent(new Event("open-mealmate-assistant"))} />
      </section>

      <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between gap-4">
          <div>
            <p className="text-primary font-semibold text-sm uppercase tracking-wide">Recent Activity</p>
            <h2 className="text-xl font-black text-gray-900 mt-1">Your latest meal planning</h2>
          </div>
          <Activity className="w-5 h-5 text-gray-300" />
        </div>
        {recentActivity.length === 0 ? (
          <div className="p-7 text-sm text-gray-500">Your recent meal-plan activity will appear here.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentActivity.map((activity) => (
              <button key={activity.id} onClick={() => setLocation(`/meal-plans/${activity.id}`)} className="w-full px-6 py-4 flex items-center gap-4 text-left hover:bg-gray-50 transition">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0"><ClipboardList className="w-5 h-5 text-primary" /></div>
                <div className="min-w-0 flex-1"><p className="font-semibold text-gray-900">{activity.title}</p><p className="text-xs text-gray-500 mt-1">{activity.date} at {activity.time}</p></div>
                <ArrowRight className="w-4 h-4 text-gray-300" />
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="bg-green-50 border border-green-100 rounded-3xl p-7 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shrink-0"><Sparkles className="w-5 h-5 text-primary" /></div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-primary">Keep your routine updated</p>
            <h2 className="text-xl font-black text-gray-900 mt-1">Need a different plan?</h2>
            <p className="text-sm text-gray-600 mt-1">Create another plan whenever your goals, ingredients or preferences change.</p>
          </div>
        </div>
        <button onClick={() => setLocation("/meal-planner")} className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white border border-green-200 text-gray-800 font-semibold hover:border-primary transition whitespace-nowrap">Create New Plan <ArrowRight className="w-4 h-4" /></button>
      </section>
    </div>
  );
}

function ActionCard({ icon, title, description, onClick }) {
  return <button onClick={onClick} className="text-left bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"><div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-5">{icon}</div><h3 className="font-bold text-lg text-gray-900">{title}</h3><p className="text-sm text-gray-500 mt-2">{description}</p><div className="flex items-center gap-1 text-primary text-sm font-semibold mt-4 group-hover:gap-2 transition-all">Open <ArrowRight className="w-4 h-4" /></div></button>;
}

function FeaturePanel({ icon, label, title, description, button, onClick }) {
  return <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center justify-between gap-5"><div className="flex items-start gap-4"><div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center shrink-0">{icon}</div><div><p className="text-xs font-bold uppercase tracking-wide text-primary">{label}</p><h3 className="font-black text-lg text-gray-900 mt-1">{title}</h3><p className="text-sm text-gray-500 mt-1">{description}</p></div></div><button onClick={onClick} className="shrink-0 flex items-center gap-1 text-primary font-semibold text-sm hover:gap-2 transition-all">{button} <ArrowRight className="w-4 h-4" /></button></div>;
}

function SummaryCard({ icon, value, label }) {
  return <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm"><div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-primary">{icon}</div><p className="text-2xl font-black text-gray-900 mt-4">{value}</p><p className="text-sm text-gray-500 mt-1">{label}</p></div>;
}

function RoutineStat({ icon, value, label }) {
  return <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 flex items-center gap-3"><div className="text-primary">{icon}</div><div className="min-w-0"><p className="font-bold text-gray-900 truncate">{value}</p><p className="text-xs text-gray-500 truncate">{label}</p></div></div>;
}

function MealCard({ type, time, meal, status }) {
  const isHighlighted = status === "current" || status === "upcoming";
  const statusLabel = status === "current" ? "Now" : status === "upcoming" ? "Up next" : "Completed";

  return <div className={`bg-white rounded-2xl border overflow-hidden shadow-sm transition-all ${isHighlighted ? "border-primary ring-2 ring-primary/10 shadow-md" : "border-gray-100"}`}><div className={`h-20 flex items-center justify-center ${isHighlighted ? "bg-green-50" : "bg-gray-50"}`}><ChefHat className={`w-8 h-8 ${isHighlighted ? "text-primary" : "text-gray-300"}`} /></div><div className="p-5"><div className="flex items-center justify-between gap-2"><p className="text-xs font-bold uppercase tracking-wide text-primary">{type}</p><span className={`text-xs font-semibold ${isHighlighted ? "text-primary" : "text-gray-400"}`}>{statusLabel}</span></div><div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2"><Clock className="w-3.5 h-3.5" /> {time}</div><h3 className="text-base font-bold text-gray-900 mt-2">{meal}</h3></div></div>;
}
