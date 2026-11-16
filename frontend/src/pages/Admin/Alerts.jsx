import AppNavbar from "@/components/AppNavbar";
import { useCallback, useEffect, useState } from "react";
import { Bell, CheckCheck, Trash2, RefreshCw, ShieldAlert, UserPlus, ChefHat, Package, ShoppingCart, Sparkles, AlertTriangle, Info } from "lucide-react";

const ICONS = {
  "user-registered": UserPlus,
  "recipe-submitted": ChefHat,
  "recipe-reported": AlertTriangle,
  "low-stock": Package,
  "order-issue": ShoppingCart,
  security: ShieldAlert,
  "ai-failure": Sparkles,
  "system-error": AlertTriangle,
};
const severityStyle = {
  info: "bg-sky-50 text-sky-700",
  warning: "bg-amber-50 text-amber-700",
  critical: "bg-red-50 text-red-700",
};

export default function AdminAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Please sign in again.");
      const response = await fetch("/api/admin/alerts", { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to load admin alerts.");
      setAlerts(data.alerts || []);
      setUnreadCount(Number(data.unreadCount) || 0);
    } catch (err) {
      setError(err.message || "Unable to load admin alerts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAlerts(); }, [loadAlerts]);

  const markRead = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/admin/alerts/${id}/read`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not mark alert as read.");
      setAlerts((items) => items.map((item) => item._id === id ? data.alert : item));
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (err) { setError(err.message); }
  };

  const markAllRead = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/alerts/read-all", { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not update alerts.");
      setAlerts((items) => items.map((item) => ({ ...item, read: true, readAt: new Date().toISOString() })));
      setUnreadCount(0);
    } catch (err) { setError(err.message); }
  };

  const deleteAlert = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/admin/alerts/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not delete alert.");
      const removed = alerts.find((item) => item._id === id);
      setAlerts((items) => items.filter((item) => item._id !== id));
      if (removed && !removed.read) setUnreadCount((count) => Math.max(0, count - 1));
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="min-h-screen bg-[#f7faf7] dark:bg-slate-950">
      <AppNavbar />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Platform monitoring</p>
            <h1 className="mt-1 text-3xl font-black text-gray-900 dark:text-slate-100">Admin Alerts</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">Important events from MealMate users, content, AI and operations.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={loadAlerts} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-slate-200"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh</button>
            <button type="button" onClick={markAllRead} disabled={!unreadCount} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><CheckCheck className="h-4 w-4" />Mark all read</button>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-900 p-5"><p className="text-sm text-gray-500 dark:text-slate-400">Total alerts loaded</p><p className="mt-2 text-3xl font-black text-gray-900 dark:text-slate-100">{alerts.length}</p></div>
          <div className="rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-900 p-5"><p className="text-sm text-gray-500 dark:text-slate-400">Unread alerts</p><p className="mt-2 text-3xl font-black text-primary">{unreadCount}</p></div>
        </section>

        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        <section className="overflow-hidden rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-900">
          {loading && !alerts.length ? <p className="p-8 text-center text-sm text-gray-500">Loading admin alerts…</p> :
          alerts.length ? <div className="divide-y divide-gray-100 dark:divide-slate-800">
            {alerts.map((alert) => {
              const Icon = ICONS[alert.type] || Info;
              return <article key={alert._id} className={`flex items-start gap-3 p-4 sm:p-5 ${alert.read ? "" : "bg-green-50/40 dark:bg-green-950/10"}`}>
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-slate-800"><Icon className="h-5 w-5 text-primary" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><h2 className="font-bold text-gray-900 dark:text-slate-100">{alert.title}</h2><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${severityStyle[alert.severity] || severityStyle.info}`}>{alert.severity}</span>{!alert.read && <span className="h-2 w-2 rounded-full bg-green-500" aria-label="Unread" />}</div>
                  <p className="mt-1 text-sm text-gray-600 dark:text-slate-300 break-words">{alert.message}</p>
                  <p className="mt-2 text-xs text-gray-400">{alert.source} · {new Date(alert.createdAt).toLocaleString()}</p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {alert.actionUrl && <a href={alert.actionUrl} className="text-xs font-semibold text-primary hover:underline">Open related section</a>}
                    {!alert.read && <button type="button" onClick={() => markRead(alert._id)} className="text-xs font-semibold text-primary hover:underline">Mark as read</button>}
                  </div>
                </div>
                <button type="button" onClick={() => deleteAlert(alert._id)} aria-label="Delete alert" className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
              </article>;
            })}
          </div> : <div className="px-6 py-16 text-center"><Bell className="mx-auto h-10 w-10 text-gray-300" /><h2 className="mt-3 font-bold text-gray-800 dark:text-slate-200">No platform alerts</h2><p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Important platform events will appear here when they occur.</p></div>}
        </section>
      </main>
    </div>
  );
}
