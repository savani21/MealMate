import { useState } from "react";
import { useLocation } from "wouter";
import { ChefHat, Menu, X } from "lucide-react";

const USER_LINKS = [
  ["Dashboard", "/dashboard"],
  ["Meal Planner", "/meal-planner"],
  ["Pantry", "/pantry"],
  ["Meal Plans", "/my-meal-plans"],
  ["Recipes", "/recipes"],
  ["Grocery Store", "/grocery-store"],
  ["Favorites", "/favorites"],
  ["Notifications", "/notifications"],
];

const ADMIN_LINKS = [
  ["Dashboard", "/dashboard"],
  ["Users", "/admin/users"],
  ["Recipes", "/admin/recipes"],
  ["Meal Plans", "/admin/meal-plans"],
  ["Analytics", "/admin/analytics"],
  ["AI Features", "/admin/ai-features"],
  ["Security", "/admin/security"],
];

export default function AppNavbar({ children }) {
  const [location, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const links = location.startsWith("/admin/") ? ADMIN_LINKS : USER_LINKS;

  const navigate = (path) => {
    setLocation(path);
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="flex shrink-0 items-center gap-2.5 rounded-xl text-left"
          aria-label="MealMate dashboard"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
            <ChefHat className="h-6 w-6 text-primary" />
          </span>
          <span className="text-xl font-black tracking-tight text-gray-900">
            Meal<span className="text-primary">Mate</span>
          </span>
        </button>

        <nav aria-label="Main navigation" className="hidden min-w-0 flex-1 items-center justify-center gap-1 xl:flex">
          {links.map(([label, path]) => {
            const active = location === path || (path !== "/dashboard" && location.startsWith(path + "/"));
            return (
              <button
                key={path}
                type="button"
                onClick={() => navigate(path)}
                aria-current={active ? "page" : undefined}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition ${active ? "bg-green-50 text-primary" : "text-gray-600 hover:bg-gray-50 hover:text-primary"}`}
              >
                {label}
              </button>
            );
          })}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 xl:flex">{children}</div>

        <div className="flex shrink-0 items-center gap-2 xl:hidden">{children}</div>

        <button
          type="button"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 xl:hidden"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {menuOpen && (
        <nav aria-label="Mobile navigation" className="border-t border-gray-100 bg-white px-4 py-3 shadow-lg xl:hidden">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-2 sm:grid-cols-3">
            {links.map(([label, path]) => {
              const active = location === path || (path !== "/dashboard" && location.startsWith(path + "/"));
              return (
                <button
                  key={path}
                  type="button"
                  onClick={() => navigate(path)}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${active ? "bg-green-50 text-primary" : "bg-gray-50 text-gray-700 hover:bg-green-50"}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
