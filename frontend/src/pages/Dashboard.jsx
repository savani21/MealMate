import { useAuth } from "@/context/AuthContext";
import AdminSection from "./Dashboard/AdminSection";
import UserSection from "./Dashboard/UserSection";

import {
  ChefHat,
  Bell,
  LogOut,
  UserCircle,
} from "lucide-react";

// One dashboard route for both admin and user
export default function Dashboard() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#f7faf7]">

      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-3">

            <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-primary" />
            </div>

            <div>
              <h1 className="text-xl font-black text-gray-900">
                Meal<span className="text-primary">Mate</span>
              </h1>

              <p className="text-xs text-gray-400 hidden sm:block">
                Your smart meal companion
              </p>
            </div>

          </div>


          {/* Right side */}
          <div className="flex items-center gap-3">

            {/* Notification */}
            <button
              className="relative w-10 h-10 rounded-xl hover:bg-gray-50 flex items-center justify-center transition"
              title="Notifications"
            >
              <Bell className="w-5 h-5 text-gray-600" />

              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
            </button>


            {/* User */}
            <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-gray-200">

              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                <UserCircle className="w-6 h-6 text-primary" />
              </div>

              <div className="leading-tight">
                <p className="text-sm font-semibold text-gray-800">
                  {user.name}
                </p>

                <p className="text-xs text-gray-400 capitalize">
                  {user.role}
                </p>
              </div>

            </div>


            {/* Logout */}
            <button
              onClick={logout}
              className="ml-2 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">
                Logout
              </span>
            </button>

          </div>

        </div>

      </header>


      {/* ================= MAIN ================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Small welcome line */}
        <div className="mb-8">

          <p className="text-sm text-primary font-semibold">
            Welcome back 👋
          </p>

          <p className="text-sm text-gray-500 mt-1">
            Manage your meals, recipes and nutrition from one place.
          </p>

        </div>


        {/* ================= COMMON STATS ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">

          <StatCard
            label="Meals Logged"
            value="--"
            description="Keep tracking your meals"
          />

          <StatCard
            label="Active Plans"
            value="--"
            description="Your current meal plans"
          />

          <StatCard
            label="Notifications"
            value="--"
            description="Stay updated"
          />

        </div>


        {/* ================= ROLE SECTION ================= */}

        {user.role === "admin" ? (
          <AdminSection />
        ) : (
          <UserSection />
        )}

      </main>

    </div>
  );
}


/* ================= STAT CARD ================= */

function StatCard({ label, value, description }) {

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-sm text-gray-500">
            {label}
          </p>

          <p className="text-3xl font-black text-gray-900 mt-2">
            {value}
          </p>

          <p className="text-xs text-gray-400 mt-2">
            {description}
          </p>

        </div>

        <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">

          <div className="w-2.5 h-2.5 rounded-full bg-primary" />

        </div>

      </div>

    </div>
  );
}