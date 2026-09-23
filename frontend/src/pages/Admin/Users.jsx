import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft,
  Users as UsersIcon,
  ShieldCheck,
  Trash2,
  Search,
  X,
  Mail,
  Calendar,
  Heart,
  ClipboardList,
  ShoppingBasket,
} from "lucide-react";

export default function Users() {
  const [, setLocation] = useLocation();
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState(null);

  const [selectedUser, setSelectedUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setLocation("/login");
        return;
      }

      const response = await fetch("http://localhost:5000/api/admin/users", {
        headers: authHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to load users");
        return;
      }

      setUsers(data.users || []);
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const openDetails = async (targetUser) => {
    setSelectedUser({ user: targetUser, mealPlans: [], groceryListCount: 0 });
    setDetailLoading(true);

    try {
      const response = await fetch(
        `http://localhost:5000/api/admin/users/${targetUser._id}`,
        { headers: authHeaders() }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to load user details");
        setSelectedUser(null);
        return;
      }

      setSelectedUser({
        user: data.user,
        mealPlans: data.mealPlans || [],
        groceryListCount: data.groceryListCount || 0,
      });
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server.");
      setSelectedUser(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleRole = async (targetUser) => {
    const newRole = targetUser.role === "admin" ? "user" : "admin";

    if (!confirm(`Change ${targetUser.name}'s role to "${newRole}"?`)) {
      return;
    }

    try {
      setBusyId(targetUser._id);

      const response = await fetch(
        `http://localhost:5000/api/admin/users/${targetUser._id}/role`,
        {
          method: "PATCH",
          headers: { ...authHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({ role: newRole }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to update role");
        return;
      }

      setUsers((prev) =>
        prev.map((u) => (u._id === targetUser._id ? { ...u, role: newRole } : u))
      );

      if (selectedUser?.user._id === targetUser._id) {
        setSelectedUser((prev) => ({ ...prev, user: { ...prev.user, role: newRole } }));
      }
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server.");
    } finally {
      setBusyId(null);
    }
  };

  const removeUser = async (targetUser) => {
    if (!confirm(`Delete ${targetUser.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      setBusyId(targetUser._id);

      const response = await fetch(
        `http://localhost:5000/api/admin/users/${targetUser._id}`,
        { method: "DELETE", headers: authHeaders() }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to delete user");
        return;
      }

      setUsers((prev) => prev.filter((u) => u._id !== targetUser._id));

      if (selectedUser?.user._id === targetUser._id) {
        setSelectedUser(null);
      }
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server.");
    } finally {
      setBusyId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-[#f7faf7]">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto h-20 px-4 sm:px-6 lg:px-8 flex items-center gap-4">
          <button
            onClick={() => setLocation("/dashboard")}
            className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center">
              <UsersIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900">Manage Users</h1>
              <p className="text-xs text-gray-400">
                {users.length} registered {users.length === 1 ? "user" : "users"}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="relative mb-6 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {loading ? (
          <p className="text-gray-400">Loading users...</p>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
            No users found.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-bold uppercase tracking-wide text-gray-400">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr
                    key={u._id}
                    className="border-t border-gray-50 hover:bg-gray-50/60 transition cursor-pointer"
                    onClick={() => openDetails(u)}
                  >
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {u.name}
                      {u._id === currentUser?._id && (
                        <span className="ml-2 text-xs text-primary font-medium">(you)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{u.email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                          u.role === "admin"
                            ? "bg-green-50 text-primary"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "--"}
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          disabled={busyId === u._id}
                          onClick={() => toggleRole(u)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 disabled:opacity-50 transition"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Make {u.role === "admin" ? "User" : "Admin"}
                        </button>

                        <button
                          disabled={busyId === u._id || u._id === currentUser?._id}
                          onClick={() => removeUser(u)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-red-500 border border-red-100 rounded-lg px-3 py-2 hover:bg-red-50 disabled:opacity-40 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* ============ USER DETAIL PANEL ============ */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-green-50 flex items-center justify-center font-black text-primary">
                  {selectedUser.user.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-900">
                    {selectedUser.user.name}
                  </h2>
                  <span
                    className={`text-xs font-bold uppercase tracking-wide ${
                      selectedUser.user.role === "admin" ? "text-primary" : "text-gray-400"
                    }`}
                  >
                    {selectedUser.user.role}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="flex items-center gap-3 text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {selectedUser.user.email}
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  Joined{" "}
                  {selectedUser.user.createdAt
                    ? new Date(selectedUser.user.createdAt).toLocaleDateString()
                    : "--"}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <MiniStat
                  icon={<ClipboardList className="w-4 h-4 text-primary" />}
                  label="Meal Plans"
                  value={detailLoading ? "--" : selectedUser.mealPlans.length}
                />
                <MiniStat
                  icon={<Heart className="w-4 h-4 text-primary" />}
                  label="Favorites"
                  value={detailLoading ? "--" : (selectedUser.user.favorites || []).length}
                />
                <MiniStat
                  icon={<ShoppingBasket className="w-4 h-4 text-primary" />}
                  label="Grocery Lists"
                  value={detailLoading ? "--" : selectedUser.groceryListCount}
                />
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">
                  Recent Meal Plans
                </h3>
                {detailLoading ? (
                  <p className="text-sm text-gray-400">Loading...</p>
                ) : selectedUser.mealPlans.length === 0 ? (
                  <p className="text-sm text-gray-400">No meal plans yet.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedUser.mealPlans.slice(0, 5).map((plan) => (
                      <div
                        key={plan._id}
                        className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2.5 text-sm"
                      >
                        <span className="font-medium text-gray-700">
                          {plan.goal} · {plan.diet}
                        </span>
                        <span className="text-xs text-gray-400">{plan.duration}d</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => toggleRole(selectedUser.user)}
                  disabled={busyId === selectedUser.user._id}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 transition"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Make {selectedUser.user.role === "admin" ? "User" : "Admin"}
                </button>
                <button
                  onClick={() => removeUser(selectedUser.user)}
                  disabled={
                    busyId === selectedUser.user._id ||
                    selectedUser.user._id === currentUser?._id
                  }
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-red-100 text-red-500 text-sm font-semibold hover:bg-red-50 disabled:opacity-40 transition"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniStat({ icon, label, value }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 text-center">
      <div className="flex items-center justify-center gap-1.5 mb-1">{icon}</div>
      <p className="text-lg font-black text-gray-900">{value}</p>
      <p className="text-[11px] text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}
