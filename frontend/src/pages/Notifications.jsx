import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft,
  Bell,
  Check,
  Trash2,
  CalendarDays,
  ShoppingBasket,
  ChefHat,
  Info,
  Clock,
} from "lucide-react";

const MEAL_TIMES = {
  breakfast: { label: "Breakfast", time: "8:00 AM", minutes: 480 },
  lunch: { label: "Lunch", time: "1:00 PM", minutes: 780 },
  snack: { label: "Snack", time: "4:00 PM", minutes: 960 },
  dinner: { label: "Dinner", time: "7:00 PM", minutes: 1140 },
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

export default function Notifications() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [mealPlans, setMealPlans] = useState([]);
  const [now, setNow] = useState(new Date());
  const [loading, setLoading] = useState(true);

  const notificationStorageKey = `mealMateNotifications:${user?._id || user?.email || "guest"}`;

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadData = async () => {
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
        console.error("Notification data error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const todayPlan = useMemo(() => {
    return mealPlans
      .filter((plan) => !plan.isArchived && getPlanDayForToday(plan, now))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null;
  }, [mealPlans, now]);

  const todayMeals = useMemo(() => getPlanDayForToday(todayPlan, now), [todayPlan, now]);

  useEffect(() => {
    if (loading) return;

    let stored = [];
    try {
      const parsed = JSON.parse(localStorage.getItem(notificationStorageKey) || "[]");
      stored = Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Failed to read notifications:", error);
    }

    const todayKey = localDateKey(now);
    const dynamic = [];

    if (todayPlan && todayMeals) {
      const currentOrUpcoming = mealOrder.find((mealKey) => {
        const status = getMealStatus(mealKey, now);
        return status === "current" || status === "upcoming";
      });

      if (currentOrUpcoming) {
        const info = MEAL_TIMES[currentOrUpcoming];
        const status = getMealStatus(currentOrUpcoming, now);
        dynamic.push({
          id: `today-${todayPlan._id}-${todayKey}-${currentOrUpcoming}`,
          type: "meal",
          title: status === "current" ? `${info.label} time` : `${info.label} is coming up`,
          message: `${todayMeals[currentOrUpcoming] || "Your planned meal"} is scheduled for ${info.time}.`,
          time: info.time,
          read: false,
          dynamic: true,
        });
      }

      dynamic.push({
        id: `plan-${todayPlan._id}-${todayKey}`,
        type: "meal",
        title: "Today's meal plan",
        message: `Day ${todayPlan.meals.indexOf(todayMeals) + 1} of your ${todayPlan.duration}-day plan is ready.`,
        time: todayKey,
        read: false,
        dynamic: true,
      });
    } else {
      dynamic.push({
        id: `no-plan-${todayKey}`,
        type: "meal",
        title: "No meal planned for today",
        message: "Generate a 1, 3 or 7-day meal plan to keep today's routine on track.",
        time: todayKey,
        read: false,
        dynamic: true,
        action: "generate",
      });
    }

    const dynamicIds = new Set(dynamic.map((item) => item.id));
    const retainedStored = stored.filter((item) => !item.dynamic || dynamicIds.has(item.id));
    const merged = dynamic.map((item) => {
      const existing = retainedStored.find((storedItem) => storedItem.id === item.id);
      return existing ? { ...item, read: existing.read } : item;
    });

    const otherStored = retainedStored.filter((item) => !dynamicIds.has(item.id));
    setNotifications([...merged, ...otherStored]);
  }, [loading, todayPlan, todayMeals, now, notificationStorageKey]);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem(notificationStorageKey, JSON.stringify(notifications));
    }
  }, [notifications, loading, notificationStorageKey]);

  const markAsRead = (id) => {
    setNotifications((prev) => prev.map((item) => item.id === id ? { ...item, read: true } : item));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  const deleteNotification = (id) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  };

  const clearAll = () => setNotifications([]);

  const getIcon = (type) => {
    if (type === "meal") return <CalendarDays className="w-5 h-5 text-primary" />;
    if (type === "grocery") return <ShoppingBasket className="w-5 h-5 text-primary" />;
    if (type === "recipe") return <ChefHat className="w-5 h-5 text-primary" />;
    return <Info className="w-5 h-5 text-primary" />;
  };

  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <div className="min-h-screen bg-[#f7faf7]">
      <header className="bg-white border-b border-gray-100">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="h-20 flex items-center justify-between">
            <button onClick={() => setLocation("/dashboard")} className="flex items-center gap-2 text-gray-600 hover:text-primary transition">
              <ArrowLeft className="w-5 h-5" /> Dashboard
            </button>
            <div className="flex items-center gap-2">
              <Bell className="w-6 h-6 text-primary" />
              <span className="text-xl font-black text-gray-900">Notifications</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <p className="text-primary text-sm font-semibold uppercase tracking-wide">Stay Updated</p>
            <h1 className="text-3xl font-black text-gray-900 mt-1">Your Notifications</h1>
            <p className="text-gray-500 mt-2">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "You're all caught up."}
            </p>
          </div>

          {notifications.length > 0 && (
            <div className="flex gap-2">
              <button onClick={markAllAsRead} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                <Check className="w-4 h-4" /> Mark all read
              </button>
              <button onClick={clearAll} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800">
                <Trash2 className="w-4 h-4" /> Clear
              </button>
            </div>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-green-50 flex items-center justify-center"><Bell className="w-8 h-8 text-primary" /></div>
            <h2 className="text-xl font-bold text-gray-900 mt-5">No notifications</h2>
            <p className="text-gray-500 mt-2">You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div key={notification.id} className={`bg-white rounded-2xl border p-5 transition ${notification.read ? "border-gray-100" : "border-green-100 bg-green-50/30"}`}>
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 shrink-0 rounded-xl bg-green-50 flex items-center justify-center">{getIcon(notification.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900">{notification.title}</h3>
                          {!notification.read && <span className="w-2 h-2 rounded-full bg-primary" />}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1"><Clock className="w-3 h-3" /> {notification.time}</p>
                        {notification.action === "generate" && (
                          <button onClick={() => setLocation("/meal-planner")} className="mt-3 text-sm font-semibold text-primary hover:underline">Generate Today's Meal</button>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {!notification.read && <button onClick={() => markAsRead(notification.id)} className="p-2 rounded-lg hover:bg-green-50" title="Mark as read"><Check className="w-4 h-4 text-primary" /></button>}
                        <button onClick={() => deleteNotification(notification.id)} className="p-2 rounded-lg hover:bg-red-50" title="Delete"><Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" /></button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
