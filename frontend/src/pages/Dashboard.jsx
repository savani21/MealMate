import AppNavbar from "@/components/AppNavbar";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";

import AdminSection from "./Dashboard/AdminSection";
import UserSection from "./Dashboard/UserSection";

import {
  ChefHat,
  Bell,
  LogOut,
  UserCircle,
  Menu,
  X,
  Home,
  User,
  Settings,
  CalendarDays,
  ClipboardList,
  ShoppingBasket,
  ShoppingCart,
  Heart,
  ChevronRight,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const [dashboardStats, setDashboardStats] = useState({
    mealsLogged: 0,
    activePlans: 0,
    notifications: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "user") return;

    const loadDashboardStats = async () => {
      try {
        setStatsLoading(true);
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch("/api/meal-plans", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Failed to load meal plans");

        const data = await response.json();
        const mealPlans = data.mealPlans || [];
        const activeMealPlans = mealPlans.filter((plan) => !plan.isArchived);

        const mealsLogged = activeMealPlans.reduce((total, plan) => {
          if (!Array.isArray(plan.meals)) return total;

          return total + plan.meals.reduce((dayTotal, day) => {
            const mealTypes = ["breakfast", "lunch", "dinner"];
            return dayTotal + mealTypes.filter(
              (mealType) => day && typeof day[mealType] === "string" && day[mealType].trim() !== ""
            ).length;
          }, 0);
        }, 0);

        const notificationStorageKey = `mealMateNotifications:${user?._id || user?.email || "guest"}`;
        let notifications = 0;

        try {
          const storedNotifications = JSON.parse(localStorage.getItem(notificationStorageKey) || "[]");
          if (Array.isArray(storedNotifications)) {
            notifications = storedNotifications.filter((notification) => !notification.read).length;
          }
        } catch (error) {
          console.error("Failed to read notifications:", error);
        }

        setDashboardStats({
          mealsLogged,
          activePlans: activeMealPlans.length,
          notifications,
        });
      } catch (error) {
        console.error("Dashboard stats error:", error);
      } finally {
        setStatsLoading(false);
      }
    };

    loadDashboardStats();
  }, [user]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  const goTo = (path) => {
    setLocation(path);
    setMenuOpen(false);
  };

  return (
    <div className="relative isolate min-h-screen overflow-x-clip bg-[radial-gradient(ellipse_at_top_left,_#fcfefc_0%,_#ffffff_52%,_#fbfdfb_100%)]">
      <AppNavbar>
          <button onClick={() => goTo("/notifications")} className="relative flex h-10 w-10 items-center justify-center rounded-xl hover:bg-gray-50" aria-label="Notifications">
            <Bell className="h-5 w-5 text-gray-600" />
            {dashboardStats.notifications > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />}
          </button>
          <button onClick={() => setMenuOpen(!menuOpen)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm hover:bg-gray-50" aria-label="Toggle account menu">
            {menuOpen ? <X className="h-5 w-5 text-gray-700" /> : <Menu className="h-5 w-5 text-gray-700" />}
          </button>
        </AppNavbar>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="mb-8">
          <p className="text-sm text-primary font-semibold">Welcome back</p>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 mt-1">{user.name}</h1>
          <p className="text-sm text-gray-500 mt-2">Manage your meals, recipes and nutrition from one place.</p>
        </section>
        {user.role === "user" && (
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
            <StatCard label="Meals Planned" value={statsLoading ? "..." : dashboardStats.mealsLogged} description="Meals in your active meal plans" />
            <StatCard label="Active Plans" value={statsLoading ? "..." : dashboardStats.activePlans} description="Your active meal plans" />
            <StatCard label="Notifications" value={statsLoading ? "..." : dashboardStats.notifications} description="Unread notifications" />
          </section>
        )}

        {user.role === "admin" ? <AdminSection /> : <UserSection />}
      </main>

      {menuOpen && <div className="fixed inset-0 bg-black/20 z-40 lg:hidden" onClick={() => setMenuOpen(false)} />}

      <div className={`fixed z-50 top-24 right-4 w-[calc(100%-2rem)] sm:w-80 lg:w-80 max-h-[calc(100vh-7rem)] bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden transition-all duration-300 ease-out ${menuOpen ? "opacity-100 translate-y-0 scale-100 pointer-events-auto" : "opacity-0 -translate-y-3 scale-95 pointer-events-none"}`}>
        <div className="max-h-[calc(100vh-7rem)] overflow-y-auto">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center shrink-0"><UserCircle className="w-7 h-7 text-primary" /></div>
              <div className="min-w-0"><p className="font-bold text-gray-900 truncate">{user.name}</p><p className="text-sm text-gray-400 capitalize mt-1">{user.role}</p></div>
            </div>
          </div>

          <div className="p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 px-3 mb-3">Menu</p>
            <MenuItem icon={<User className="w-5 h-5" />} label="Profile" onClick={() => goTo("/profile")} />

            {user.role === "user" && (
              <>
                <div className="mt-5 mb-3 px-3 text-xs font-bold uppercase tracking-wider text-gray-400">My MealMate</div>
                <MenuItem icon={<ShoppingBasket className="w-5 h-5" />} label="Grocery List" onClick={() => goTo("/user/grocery")} />
                <MenuItem icon={<ShoppingBasket className="w-5 h-5" />} label="Pantry" onClick={() => goTo("/pantry")} />
                <MenuItem icon={<ShoppingCart className="w-5 h-5" />} label="Cart & Grocery Store" onClick={() => goTo("/grocery-store")} />
                <MenuItem icon={<ChefHat className="w-5 h-5" />} label="Recipes" onClick={() => goTo("/recipes")} />
                <MenuItem icon={<Heart className="w-5 h-5" />} label="Favorites" onClick={() => goTo("/favorites")} />
              </>
            )}

            {user.role === "admin" && (
              <>
                <div className="mt-5 mb-3 px-3 text-xs font-bold uppercase tracking-wider text-gray-400">Administration</div>
                <MenuItem icon={<User className="w-5 h-5" />} label="Manage Users" onClick={() => goTo("/admin/users")} />
                <MenuItem icon={<ChefHat className="w-5 h-5" />} label="Manage Recipes" onClick={() => goTo("/admin/recipes")} />
                <MenuItem icon={<ClipboardList className="w-5 h-5" />} label="Meal Plans" onClick={() => goTo("/admin/meal-plans")} />
                <MenuItem icon={<CalendarDays className="w-5 h-5" />} label="Analytics" onClick={() => goTo("/admin/analytics")} />
                <MenuItem icon={<Sparkles className="w-5 h-5" />} label="AI Features" onClick={() => goTo("/admin/ai-features")} />
                <MenuItem icon={<ShieldCheck className="w-5 h-5" />} label="Security" onClick={() => goTo("/admin/security")} />
              </>
            )}

            <div className="mt-5 mb-3 px-3 text-xs font-bold uppercase tracking-wider text-gray-400">General</div>
            <MenuItem icon={<Bell className="w-5 h-5" />} label="Notifications" onClick={() => goTo("/notifications")} />
            <MenuItem icon={<Settings className="w-5 h-5" />} label="Settings" onClick={() => goTo("/settings")} />
            <div className="border-t border-gray-100 my-4" />
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-500 font-semibold text-sm hover:bg-red-50 transition">
              <LogOut className="w-5 h-5" /> Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, description }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <p className="text-sm font-semibold text-gray-500">{label}</p>
      <p className="text-3xl font-black text-gray-900 mt-2">{value}</p>
      <p className="text-xs text-gray-400 mt-2">{description}</p>
    </div>
  );
}

function MenuItem({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition ${active ? "bg-green-50 text-primary" : "text-gray-600 hover:bg-gray-50"}`}>
      {icon}
      <span className="flex-1 text-left">{label}</span>
      <ChevronRight className="w-4 h-4 text-gray-300" />
    </button>
  );
}
