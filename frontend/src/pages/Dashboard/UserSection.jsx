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

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

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
    const matchingPlans = mealPlans
      .filter((plan) => !plan.isArchived && getPlanDayForToday(plan, now))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return matchingPlans[0] || null;
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

  return (
    <div className="space-y-8">
      <section className="bg-green-50 border border-green-100 rounded-3xl p-8 md:p-10">
        <p className="text-primary font-semibold text-sm uppercase tracking-wide">
          Welcome to MealMate
        </p>
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mt-2">
          Eat better.
          <br />
          <span className="text-primary">Live healthier.</span>
        </h1>
        <p className="text-gray-600 mt-4 max-w-xl">
          Welcome back, {user?.name || "User"}! Plan your meals, manage your saved plans
          and organize your groceries.
        </p>
      </section>

      <section>
        <div className="mb-5">
          <p className="text-primary font-semibold text-sm uppercase tracking-wide">Your MealMate</p>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 mt-1">What would you like to do?</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <ActionCard icon={<CalendarDays className="w-6 h-6 text-primary" />} title="Meal Planner" description="Create a personalized meal plan." onClick={() => setLocation("/meal-planner")} />
          <ActionCard icon={<ClipboardList className="w-6 h-6 text-primary" />} title="My Meal Plans" description="View your saved meal plans." onClick={() => setLocation("/my-meal-plans")} />
          <ActionCard icon={<ShoppingBasket className="w-6 h-6 text-primary" />} title="Grocery List" description="View and manage your grocery list." onClick={() => setLocation("/user/grocery")} />
          <ActionCard icon={<Heart className="w-6 h-6 text-primary" />} title="Favorites" description="View your saved favorite recipes." onClick={() => setLocation("/favorites")} />
        </div>
      </section>

      <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-7 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-primary">MealMate AI</p>
              <h2 className="text-xl font-black text-gray-900 mt-1">Need a meal idea?</h2>
              <p className="text-sm text-gray-500 mt-1">Get personalized recipe recommendations based on your preferences.</p>
            </div>
          </div>
          <button onClick={() => setLocation("/recipes")} className="flex items-center justify-center gap-2 bg-primary text-white px-5 py-3 rounded-xl font-semibold hover:opacity-90 transition whitespace-nowrap">
            <ChefHat className="w-5 h-5" /> Find Recipes
          </button>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-primary font-semibold text-sm uppercase tracking-wide">Today's Plan</p>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 mt-1">Your Meals Today</h2>
            <p className="text-sm text-gray-500 mt-1">{todayLabel} • Healthy routine</p>
          </div>
          <button onClick={() => setLocation("/my-meal-plans")} className="hidden sm:flex items-center gap-1 text-primary font-semibold text-sm hover:gap-2 transition-all">
            View Plan <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {loadingMeals ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-500">Loading today's meals...</div>
        ) : !todayPlan ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <CalendarDays className="w-9 h-9 text-primary mx-auto" />
            <h3 className="font-bold text-gray-900 mt-3">No meal planned for today</h3>
            <p className="text-sm text-gray-500 mt-1">Generate a 1, 3 or 7-day plan to build your daily routine.</p>
            <button onClick={() => setLocation("/meal-planner")} className="mt-4 px-5 py-2.5 rounded-xl bg-primary text-white font-semibold">Generate Today's Meal</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {mealOrder.map((mealKey) => {
              const mealInfo = MEAL_TIMES[mealKey];
              const status = getMealStatus(mealKey, now);
              const mealName = todayMeals?.[mealKey] || "Meal not available";

              return (
                <MealCard
                  key={mealKey}
                  type={mealInfo.label}
                  time={mealInfo.time}
                  meal={mealName}
                  status={status}
                />
              );
            })}
          </div>
        )}
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
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2">
          <Clock className="w-3.5 h-3.5" /> {time}
        </div>
        <h3 className="text-base font-bold text-gray-900 mt-2">{meal}</h3>
      </div>
    </div>
  );
}
