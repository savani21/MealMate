import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChefHat,
  ShoppingBasket,
  Heart,
  ArrowRight,
  Sparkles,
  ClipboardList,
  Clock,
  MessageCircle,
  Utensils,
  CheckCircle2,
} from "lucide-react";

import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";

const MEAL_TIMES = {
  breakfast: { label: "Breakfast", time: "8:00 AM", minutes: 8 * 60 },
  lunch: { label: "Lunch", time: "1:00 PM", minutes: 13 * 60 },
  snack: { label: "Snack", time: "4:00 PM", minutes: 16 * 60 },
  dinner: { label: "Dinner", time: "7:00 PM", minutes: 19 * 60 },
};

const mealOrder = ["breakfast", "lunch", "snack", "dinner"];

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

export default function UserSection() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [mealPlans, setMealPlans] = useState([]);
  const [now, setNow] = useState(new Date());
  const [loadingMeals, setLoadingMeals] = useState(true);

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

  const todayPlan = useMemo(() => {
    return mealPlans
      .filter((plan) => !plan.isArchived && getPlanDayForToday(plan, now))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null;
  }, [mealPlans, now]);

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

  return (
    <div className="space-y-8">
      {/* Today's meal plan comes first */}
      <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-green-50 border-b border-green-100 px-7 py-6 md:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-primary font-bold text-sm uppercase tracking-wide">Today's Meal Plan</p>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 mt-1">Your healthy routine for today</h1>
            <p className="text-sm text-gray-600 mt-1">{todayLabel}</p>
          </div>
          {todayPlan && (
            <button
              onClick={() => setLocation(`/meal-plans/${todayPlan._id}`)}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-white font-semibold hover:opacity-90 transition"
            >
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6 md:p-7">
              {mealOrder.map((mealKey) => {
                const mealInfo = MEAL_TIMES[mealKey];
                return (
                  <MealCard
                    key={mealKey}
                    type={mealInfo.label}
                    time={mealInfo.time}
                    meal={todayMeals?.[mealKey] || "Meal not available"}
                    status={getMealStatus(mealKey, now)}
                  />
                );
              })}
            </div>

            <div className="px-6 pb-6 md:px-7 md:pb-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <RoutineStat icon={<CheckCircle2 className="w-5 h-5" />} value={`${completedMealCount}/4`} label="Meals completed by time" />
              <RoutineStat icon={<Clock className="w-5 h-5" />} value={currentMeal ? MEAL_TIMES[currentMeal].label : nextMeal ? MEAL_TIMES[nextMeal].label : "Complete"} label={currentMeal ? "Meal happening now" : nextMeal ? "Next meal" : "Today's routine"} />
              <RoutineStat icon={<Utensils className="w-5 h-5" />} value={`${todayPlan.duration} day`} label="Current plan" />
            </div>
          </>
        )}
      </section>

      {/* Quick actions */}
      <section>
        <div className="mb-5">
          <p className="text-primary font-semibold text-sm uppercase tracking-wide">Quick Access</p>
          <h2 className="text-2xl font-black text-gray-900 mt-1">Manage your meals</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <ActionCard icon={<CalendarDays className="w-6 h-6 text-primary" />} title="Meal Planner" description="Create a new personalized plan." onClick={() => setLocation("/meal-planner")} />
          <ActionCard icon={<ClipboardList className="w-6 h-6 text-primary" />} title="My Meal Plans" description="Compare and manage saved plans." onClick={() => setLocation("/my-meal-plans")} />
          <ActionCard icon={<ShoppingBasket className="w-6 h-6 text-primary" />} title="Grocery List" description="Manage ingredients to purchase." onClick={() => setLocation("/user/grocery")} />
          <ActionCard icon={<Heart className="w-6 h-6 text-primary" />} title="Favorites" description="Open your saved recipes." onClick={() => setLocation("/favorites")} />
        </div>
      </section>

      {/* Discover section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <FeaturePanel
          icon={<ChefHat className="w-6 h-6 text-primary" />}
          label="Recipes"
          title="Find something delicious"
          description="Browse recipes or generate one for a meal from your plan."
          button="Explore Recipes"
          onClick={() => setLocation("/recipes")}
        />
        <FeaturePanel
          icon={<MessageCircle className="w-6 h-6 text-primary" />}
          label="MealMate AI"
          title="Ask your meal assistant"
          description="Get help with meal ideas, ingredients and healthy food choices."
          button="Open Assistant"
          onClick={() => setLocation("/dashboard")}
        />
      </section>

      {/* Personalization */}
      <section className="bg-green-50 border border-green-100 rounded-3xl p-7 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-primary">Keep your routine updated</p>
            <h2 className="text-xl font-black text-gray-900 mt-1">Need a different plan?</h2>
            <p className="text-sm text-gray-600 mt-1">Create another plan whenever your goals, ingredients or preferences change.</p>
          </div>
        </div>
        <button onClick={() => setLocation("/meal-planner")} className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white border border-green-200 text-gray-800 font-semibold hover:border-primary transition whitespace-nowrap">
          Create New Plan <ArrowRight className="w-4 h-4" />
        </button>
      </section>
    </div>
  );
}

function ActionCard({ icon, title, description, onClick }) {
  return (
    <button onClick={onClick} className="text-left bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
      <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-5">{icon}</div>
      <h3 className="font-bold text-lg text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 mt-2">{description}</p>
      <div className="flex items-center gap-1 text-primary text-sm font-semibold mt-4 group-hover:gap-2 transition-all">Open <ArrowRight className="w-4 h-4" /></div>
    </button>
  );
}

function FeaturePanel({ icon, label, title, description, button, onClick }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center justify-between gap-5">
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center shrink-0">{icon}</div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-primary">{label}</p>
          <h3 className="font-black text-lg text-gray-900 mt-1">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
      </div>
      <button onClick={onClick} className="shrink-0 flex items-center gap-1 text-primary font-semibold text-sm hover:gap-2 transition-all">
        {button} <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function RoutineStat({ icon, value, label }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 flex items-center gap-3">
      <div className="text-primary">{icon}</div>
      <div className="min-w-0">
        <p className="font-bold text-gray-900 truncate">{value}</p>
        <p className="text-xs text-gray-500 truncate">{label}</p>
      </div>
    </div>
  );
}

function MealCard({ type, time, meal, status }) {
  const isHighlighted = status === "current" || status === "upcoming";
  const statusLabel = status === "current" ? "Now" : status === "upcoming" ? "Up next" : "Completed";

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden shadow-sm transition-all ${isHighlighted ? "border-primary ring-2 ring-primary/10 shadow-md" : "border-gray-100"}`}>
      <div className={`h-20 flex items-center justify-center ${isHighlighted ? "bg-green-50" : "bg-gray-50"}`}>
        <ChefHat className={`w-8 h-8 ${isHighlighted ? "text-primary" : "text-gray-300"}`} />
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-wide text-primary">{type}</p>
          <span className={`text-xs font-semibold ${isHighlighted ? "text-primary" : "text-gray-400"}`}>{statusLabel}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2"><Clock className="w-3.5 h-3.5" /> {time}</div>
        <h3 className="text-base font-bold text-gray-900 mt-2">{meal}</h3>
      </div>
    </div>
  );
}
