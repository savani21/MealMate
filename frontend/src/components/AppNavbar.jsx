import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import {
  ChefHat, Search, ChevronDown, Menu, X, CalendarDays, BookOpen,
  Heart, Package, ShoppingCart, Store, Sparkles, Bell, UserRound,
  Settings, LogOut, LayoutDashboard, Users, BarChart3, ShieldCheck,
} from "lucide-react";

const USER_GROUPS = [
  {
    label: "Recipes",
    items: [
      { label: "All Recipes", path: "/recipes", icon: BookOpen },
      { label: "Favorites", path: "/favorites", icon: Heart },
    ],
  },
  {
    label: "My Kitchen",
    items: [
      { label: "Meal Planner", path: "/meal-planner", icon: CalendarDays },
      { label: "My Meal Plans", path: "/my-meal-plans", icon: BookOpen },
      { label: "Pantry", path: "/pantry", icon: Package },
      { label: "Grocery List", path: "/user/grocery", icon: ShoppingCart },
      { label: "Grocery Store", path: "/grocery-store", icon: Store },
    ],
  },
  {
    label: "Explore",
    items: [
      { label: "AI Meal Assistant", path: "/meal-planner", icon: Sparkles },
      { label: "Notifications", path: "/notifications", icon: Bell },
    ],
  },
];

const ADMIN_GROUPS = [
  {
    label: "Manage",
    items: [
      { label: "Users", path: "/admin/users", icon: Users },
      { label: "Recipes", path: "/admin/recipes", icon: BookOpen },
      { label: "Meal Plans", path: "/admin/meal-plans", icon: CalendarDays },
      { label: "Analytics", path: "/admin/analytics", icon: BarChart3 },
      { label: "AI Features", path: "/admin/ai-features", icon: Sparkles },
      { label: "Security", path: "/admin/security", icon: ShieldCheck },
    ],
  },
];

export default function AppNavbar({ children }) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const [openMenu, setOpenMenu] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const isAdmin = user?.role === "admin" || location.startsWith("/admin/");
  const groups = isAdmin ? ADMIN_GROUPS : USER_GROUPS;

  const navigate = (path) => {
    setLocation(path);
    setOpenMenu("");
    setMobileOpen(false);
  };

  const submitSearch = (event) => {
    event.preventDefault();
    const query = search.trim();
    if (query) navigate(`/recipes?search=${encodeURIComponent(query)}`);
  };

  const active = (path) => location === path || location.startsWith(path + "/");

  const renderGroup = (group) => (
    <div key={group.label} className="relative">
      <button
        type="button"
        onClick={() => setOpenMenu((current) => current === group.label ? "" : group.label)}
        aria-expanded={openMenu === group.label}
        className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition ${openMenu === group.label || group.items.some((item) => active(item.path)) ? "bg-green-50 text-primary" : "text-gray-700 hover:bg-gray-50 hover:text-primary"}`}
      >
        {group.label}<ChevronDown className={`h-4 w-4 transition-transform ${openMenu === group.label ? "rotate-180" : ""}`} />
      </button>
      {openMenu === group.label && (
        <div className="absolute left-0 top-full z-50 mt-3 w-64 rounded-2xl border border-gray-100 bg-white p-2 shadow-xl">
          {group.items.map(({ label, path, icon: Icon }) => (
            <button key={path + label} type="button" onClick={() => navigate(path)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${active(path) ? "bg-green-50 text-primary" : "text-gray-700 hover:bg-gray-50"}`}>
              <Icon className="h-4 w-4 shrink-0" />{label}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[76px] w-full max-w-7xl items-center gap-5 px-4 sm:px-6 lg:px-8">
        <button type="button" onClick={() => navigate("/dashboard")} aria-label="MealMate dashboard" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-50"><ChefHat className="h-6 w-6 text-primary" /></span>
          <span className="text-xl font-black tracking-tight text-gray-900">Meal<span className="text-primary">Mate</span></span>
        </button>

        <nav aria-label="Main navigation" className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          <button type="button" onClick={() => navigate("/dashboard")} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${active("/dashboard") ? "bg-green-50 text-primary" : "text-gray-700 hover:bg-gray-50"}`}>Home</button>
          {groups.map(renderGroup)}
        </nav>

        <form onSubmit={submitSearch} role="search" className="hidden w-52 shrink-0 items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-2.5 focus-within:border-green-400 focus-within:bg-white xl:flex">
          <Search className="h-4 w-4 shrink-0 text-gray-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a recipe..." aria-label="Search recipes" className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-gray-400" />
        </form>

        <div className="ml-auto hidden shrink-0 items-center gap-2 lg:flex">
          {children}
          <button type="button" onClick={() => navigate("/profile")} aria-label="Profile" className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:bg-green-50 hover:text-primary"><UserRound className="h-5 w-5" /></button>
          <button type="button" onClick={() => navigate("/settings")} aria-label="Settings" className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:bg-gray-50"><Settings className="h-5 w-5" /></button>
          {user && <button type="button" onClick={() => { logout(); navigate("/login"); }} aria-label="Log out" title="Log out" className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition hover:bg-red-50 hover:text-red-600"><LogOut className="h-5 w-5" /></button>}
        </div>

        <button type="button" onClick={() => setMobileOpen((value) => !value)} aria-label={mobileOpen ? "Close menu" : "Open menu"} aria-expanded={mobileOpen} className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-700 lg:hidden">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white px-4 py-4 shadow-lg lg:hidden">
          <form onSubmit={submitSearch} role="search" className="mb-4 flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
            <Search className="h-4 w-4 text-gray-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search recipes or ingredients..." aria-label="Search recipes" className="w-full bg-transparent text-sm outline-none" />
            <button type="submit" className="text-sm font-semibold text-primary">Search</button>
          </form>
          <button type="button" onClick={() => navigate("/dashboard")} className="mb-2 w-full rounded-xl px-3 py-3 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"><LayoutDashboard className="mr-2 inline h-4 w-4" />Home</button>
          {groups.map((group) => (
            <section key={group.label} className="border-t border-gray-100 py-2">
              <button type="button" onClick={() => setOpenMenu((current) => current === group.label ? "" : group.label)} aria-expanded={openMenu === group.label} className="flex w-full items-center justify-between px-3 py-3 text-left text-sm font-bold text-gray-900">
                {group.label}<ChevronDown className={`h-4 w-4 transition-transform ${openMenu === group.label ? "rotate-180" : ""}`} />
              </button>
              {openMenu === group.label && <div className="grid grid-cols-2 gap-2 px-2 pb-2">
                {group.items.map(({ label, path, icon: Icon }) => <button key={path + label} type="button" onClick={() => navigate(path)} className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-3 text-left text-xs font-semibold text-gray-700"><Icon className="h-4 w-4 text-primary" />{label}</button>)}
              </div>}
            </section>
          ))}
          <div className="grid grid-cols-2 gap-2 border-t border-gray-100 pt-3">
            <button type="button" onClick={() => navigate("/profile")} className="rounded-xl bg-gray-50 px-3 py-3 text-sm font-semibold text-gray-700"><UserRound className="mr-2 inline h-4 w-4" />Profile</button>
            {user && <button type="button" onClick={() => { logout(); navigate("/login"); }} className="rounded-xl bg-red-50 px-3 py-3 text-sm font-semibold text-red-600"><LogOut className="mr-2 inline h-4 w-4" />Logout</button>}
          </div>
          {children && <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">{children}</div>}
        </div>
      )}
    </header>
  );
}
