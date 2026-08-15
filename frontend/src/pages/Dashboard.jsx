import { useAuth } from "@/context/AuthContext";
import AdminSection from "./dashboard/AdminSection";
import UserSection from "./dashboard/UserSection";

// One dashboard, one route (/dashboard), for both roles.
// Shared widgets render for everyone; the section below splits by role.
export default function Dashboard() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">MealMate Dashboard</h1>
          <p className="text-sm text-gray-500">
            Welcome back, {user.name} <span className="capitalize">({user.role})</span>
          </p>
        </div>
        <button
          onClick={logout}
          className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 transition"
        >
          Logout
        </button>
      </header>

      <main className="p-6 max-w-6xl mx-auto">
        {/* Shared stats - same for both roles for now */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard label="Meals Logged" value="--" />
          <StatCard label="Active Plans" value="--" />
          <StatCard label="Notifications" value="--" />
        </div>

        {/* Role-specific section - swap this out as functionality diverges */}
        {user.role === "admin" ? <AdminSection /> : <UserSection />}
      </main>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
    </div>
  );
}
