import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  KeyRound,
  Globe,
  UserCog,
  ShieldOff,
} from "lucide-react";

export default function Security() {
  const [, setLocation] = useLocation();
  const { user: currentUser } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    fetchOverview();
  }, []);

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  const fetchOverview = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setLocation("/login");
        return;
      }

      const response = await fetch("http://localhost:5000/api/admin/security/overview", {
        headers: authHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.message || "Failed to load security overview");
        return;
      }

      setData(result);
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const revokeAdmin = async (admin) => {
    if (admin._id === currentUser?._id) {
      alert("You cannot remove your own admin access.");
      return;
    }

    if (!confirm(`Remove admin access for ${admin.name}?`)) {
      return;
    }

    try {
      setBusyId(admin._id);

      const response = await fetch(
        `http://localhost:5000/api/admin/users/${admin._id}/role`,
        {
          method: "PATCH",
          headers: { ...authHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({ role: "user" }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        alert(result.message || "Failed to update role");
        return;
      }

      setData((prev) => ({
        ...prev,
        admins: prev.admins.filter((a) => a._id !== admin._id),
        totalAdmins: prev.totalAdmins - 1,
      }));
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server.");
    } finally {
      setBusyId(null);
    }
  };

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
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900">Security</h1>
              <p className="text-xs text-gray-400">Access control & platform security posture</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {loading || !data ? (
          <p className="text-gray-400">Loading security overview...</p>
        ) : (
          <>
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <PostureCard
                icon={<Lock className="w-5 h-5 text-primary" />}
                label="Password Hashing"
                value={data.posture.passwordHashing}
              />
              <PostureCard
                icon={<KeyRound className="w-5 h-5 text-primary" />}
                label="Auth Method"
                value={data.posture.authMethod}
              />
              <PostureCard
                icon={<UserCog className="w-5 h-5 text-primary" />}
                label="Admin Guard"
                value={data.posture.adminGuard}
              />
              <PostureCard
                icon={<Globe className="w-5 h-5 text-primary" />}
                label="CORS"
                value={data.posture.cors}
              />
            </section>

            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-black text-gray-900">Admin Accounts</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {data.totalAdmins} of {data.totalUsers} users have admin access
                  </p>
                </div>
              </div>

              {data.admins.length === 0 ? (
                <p className="text-sm text-gray-400">No admin accounts found.</p>
              ) : (
                <div className="space-y-3">
                  {data.admins.map((admin) => (
                    <div
                      key={admin._id}
                      className="flex items-center justify-between gap-4 bg-gray-50 rounded-xl p-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-black text-primary shrink-0">
                          {admin.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {admin.name}
                            {admin._id === currentUser?._id && (
                              <span className="ml-2 text-xs text-primary font-medium">
                                (you)
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-400 truncate">{admin.email}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => revokeAdmin(admin)}
                        disabled={busyId === admin._id || admin._id === currentUser?._id}
                        className="flex items-center gap-1.5 text-xs font-semibold text-red-500 border border-red-100 rounded-lg px-3 py-2 hover:bg-red-50 disabled:opacity-40 transition shrink-0"
                      >
                        <ShieldOff className="w-3.5 h-3.5" />
                        Revoke Admin
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function PostureCard({ icon, label, value }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mb-3">
        {icon}
      </div>
      <p className="text-xs font-bold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="text-sm font-semibold text-gray-800 mt-1">{value}</p>
    </div>
  );
}
