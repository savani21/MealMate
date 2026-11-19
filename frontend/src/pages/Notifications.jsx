import AppNavbar from "@/components/AppNavbar";
import PageHeroBanner from "@/components/PageHeroBanner";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Bell,
  Check,
  Trash2,
  CalendarDays,
  ShoppingBasket,
  ChefHat,
  Info,
  Clock,
} from "lucide-react";

function getNotificationMessage(item) {
  if (item.type !== "order-delivered") return item.message;
  const outcomeText = item.deliveryOutcome === "early"
    ? "Your grocery order arrived earlier than expected."
    : item.deliveryOutcome === "late"
      ? "Your grocery order arrived later than scheduled."
      : "Your grocery order was delivered on time.";
  const formatTime = (value) => value
    ? new Date(value).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    : "";
  const expected = formatTime(item.expectedDeliveryAt);
  const actual = formatTime(item.deliveredAt);
  if (!expected || !actual) return item.message;
  return `${outcomeText} Expected by ${expected}; delivered at ${actual}. Your purchased ingredients have been added to your pantry.`;
}

function formatCreatedAt(value) {
  if (!value) return "Just now";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Just now" : date.toLocaleString();
}

export default function Notifications() {
  const { user } = useAuth();
  const userId = user?._id || user?.id;
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotifications = useCallback(async (isActive = () => true) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to load notifications.");
      const data = await response.json();
      if (!isActive()) return;
      const items = (data.notifications || [])
        .slice()
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setNotifications(items);
      setError("");
    } catch (loadError) {
      if (isActive()) {
        console.error("Notification loading error:", loadError);
        setError("Unable to load notifications. Please try again.");
      }
    } finally {
      if (isActive()) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    let inFlight = false;
    const isActive = () => active;
    const refresh = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        await loadNotifications(isActive);
      } finally {
        inFlight = false;
      }
    };

    setLoading(true);
    refresh();
    const timer = setInterval(refresh, 15000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [userId, loadNotifications]);

  const markAsRead = async (id) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Could not mark notification as read.");
      setNotifications((items) => items.map((item) =>
        item._id === id ? { ...item, read: true, readAt: new Date().toISOString() } : item
      ));
      window.dispatchEvent(new Event("mealmate:notifications-updated"));
    } catch (actionError) {
      console.error(actionError);
      setError("Could not update the notification. Please try again.");
      loadNotifications();
    }
  };

  const markAllAsRead = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("/api/notifications/read-all", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Could not mark notifications as read.");
      const readAt = new Date().toISOString();
      setNotifications((items) => items.map((item) => ({ ...item, read: true, readAt })));
      window.dispatchEvent(new Event("mealmate:notifications-updated"));
    } catch (actionError) {
      console.error(actionError);
      setError("Could not update notifications. Please try again.");
      loadNotifications();
    }
  };

  const deleteNotification = async (id) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Could not delete notification.");
      setNotifications((items) => items.filter((item) => item._id !== id));
      window.dispatchEvent(new Event("mealmate:notifications-updated"));
    } catch (actionError) {
      console.error(actionError);
      setError("Could not delete the notification. Please try again.");
    }
  };

  const clearAll = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("/api/notifications", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Could not clear notifications.");
      setNotifications([]);
      window.dispatchEvent(new Event("mealmate:notifications-updated"));
    } catch (actionError) {
      console.error(actionError);
      setError("Could not clear notifications. Please try again.");
    }
  };

  const getIcon = (type) => {
    if (type === "meal") return <CalendarDays className="w-5 h-5 text-primary" />;
    if (type === "grocery" || type === "pantry-expiry" || type === "order-delivered" || type === "order-placed") {
      return <ShoppingBasket className="w-5 h-5 text-primary" />;
    }
    if (type === "recipe") return <ChefHat className="w-5 h-5 text-primary" />;
    return <Info className="w-5 h-5 text-primary" />;
  };

  return (
    <div className="min-h-screen bg-[#f7faf7]">
      <AppNavbar />
      <PageHeroBanner title="Your Notifications" description="Stay up to date with your meal plans and kitchen activity." eyebrow="STAY UPDATED" icon={Bell} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {error && <p role="alert" className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        {notifications.length > 0 && (
          <div className="mb-3 flex gap-2">
            <button onClick={markAllAsRead} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              <Check className="w-4 h-4" /> Mark all read
            </button>
            <button onClick={clearAll} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800">
              <Trash2 className="w-4 h-4" /> Clear
            </button>
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center text-gray-500">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-green-50 flex items-center justify-center"><Bell className="w-8 h-8 text-primary" /></div>
            <h2 className="text-xl font-bold text-gray-900 mt-5">No notifications</h2>
            <p className="text-gray-500 mt-2">You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div key={notification._id} className={`bg-white rounded-2xl border p-5 transition ${notification.read ? "border-gray-100" : "border-green-100 bg-green-50/30"}`}>
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 shrink-0 rounded-xl bg-green-50 flex items-center justify-center">{getIcon(notification.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900">{notification.title}</h3>
                          {!notification.read && <span className="w-2 h-2 rounded-full bg-primary" />}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{getNotificationMessage(notification)}</p>
                        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1"><Clock className="w-3 h-3" /> {formatCreatedAt(notification.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {!notification.read && <button onClick={() => markAsRead(notification._id)} className="p-2 rounded-lg hover:bg-green-50" title="Mark as read" aria-label="Mark as read"><Check className="w-4 h-4 text-primary" /></button>}
                        <button onClick={() => deleteNotification(notification._id)} className="p-2 rounded-lg hover:bg-red-50" title="Delete" aria-label="Delete notification"><Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" /></button>
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
