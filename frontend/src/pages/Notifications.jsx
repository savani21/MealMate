import { useEffect, useState } from "react";
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
} from "lucide-react";

export default function Notifications() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const notificationStorageKey = `mealMateNotifications:${
    user?._id || user?.email || "guest"
  }`;

  const defaultNotifications = [
    {
      id: 1,
      type: "meal",
      title: "Meal Plan Ready",
      message: "Your personalized meal plan is ready to view.",
      time: "Today",
      read: false,
    },
    {
      id: 2,
      type: "grocery",
      title: "Grocery Reminder",
      message: "Don't forget to check your grocery list.",
      time: "Today",
      read: false,
    },
    {
      id: 3,
      type: "recipe",
      title: "New Recipe",
      message: "Discover delicious recipes on MealMate.",
      time: "Yesterday",
      read: true,
    },
  ];

  const [notifications, setNotifications] = useState(() => {
    try {
      const stored = localStorage.getItem(notificationStorageKey);

      if (stored) {
        const parsed = JSON.parse(stored);

        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }

    return defaultNotifications;
  });

  useEffect(() => {
    localStorage.setItem(
      notificationStorageKey,
      JSON.stringify(notifications)
    );
  }, [notificationStorageKey, notifications]);

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({
        ...notification,
        read: true,
      }))
    );
  };

  const deleteNotification = (id) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getIcon = (type) => {
    if (type === "meal") {
      return <CalendarDays className="w-5 h-5 text-primary" />;
    }

    if (type === "grocery") {
      return <ShoppingBasket className="w-5 h-5 text-primary" />;
    }

    if (type === "recipe") {
      return <ChefHat className="w-5 h-5 text-primary" />;
    }

    return <Info className="w-5 h-5 text-primary" />;
  };

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  return (
    <div className="min-h-screen bg-[#f7faf7]">

      {/* HEADER */}
      <header className="bg-white border-b border-gray-100">

        <div className="w-full px-4 sm:px-6 lg:px-8">

          <div className="h-20 flex items-center justify-between">

            <button
              onClick={() => setLocation("/dashboard")}
              className="flex items-center gap-2 text-gray-600 hover:text-primary transition"
            >
              <ArrowLeft className="w-5 h-5" />
              Dashboard
            </button>

            <div className="flex items-center gap-2">

              <Bell className="w-6 h-6 text-primary" />

              <span className="text-xl font-black text-gray-900">
                Notifications
              </span>

            </div>

          </div>

        </div>

      </header>


      {/* MAIN */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* TITLE */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">

          <div>

            <p className="text-primary text-sm font-semibold uppercase tracking-wide">
              Stay Updated
            </p>

            <h1 className="text-3xl font-black text-gray-900 mt-1">
              Your Notifications
            </h1>

            <p className="text-gray-500 mt-2">
              {unreadCount > 0
                ? `${unreadCount} unread notification${
                    unreadCount > 1 ? "s" : ""
                  }`
                : "You're all caught up."}
            </p>

          </div>


          {notifications.length > 0 && (
            <div className="flex gap-2">

              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                <Check className="w-4 h-4" />
                Mark all read
              </button>

              <button
                onClick={clearAll}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>

            </div>
          )}

        </div>


        {/* NOTIFICATIONS */}
        {notifications.length === 0 ? (

          <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">

            <div className="w-16 h-16 mx-auto rounded-2xl bg-green-50 flex items-center justify-center">

              <Bell className="w-8 h-8 text-primary" />

            </div>

            <h2 className="text-xl font-bold text-gray-900 mt-5">
              No notifications
            </h2>

            <p className="text-gray-500 mt-2">
              You're all caught up!
            </p>

          </div>

        ) : (

          <div className="space-y-3">

            {notifications.map((notification) => (

              <div
                key={notification.id}
                className={`bg-white rounded-2xl border p-5 transition ${
                  notification.read
                    ? "border-gray-100"
                    : "border-green-100 bg-green-50/30"
                }`}
              >

                <div className="flex items-start gap-4">

                  {/* ICON */}
                  <div className="w-11 h-11 shrink-0 rounded-xl bg-green-50 flex items-center justify-center">
                    {getIcon(notification.type)}
                  </div>


                  {/* CONTENT */}
                  <div className="flex-1 min-w-0">

                    <div className="flex items-start justify-between gap-3">

                      <div>

                        <div className="flex items-center gap-2">

                          <h3 className="font-bold text-gray-900">
                            {notification.title}
                          </h3>

                          {!notification.read && (
                            <span className="w-2 h-2 rounded-full bg-primary" />
                          )}

                        </div>

                        <p className="text-sm text-gray-500 mt-1">
                          {notification.message}
                        </p>

                        <p className="text-xs text-gray-400 mt-2">
                          {notification.time}
                        </p>

                      </div>


                      {/* ACTIONS */}
                      <div className="flex items-center gap-1">

                        {!notification.read && (
                          <button
                            onClick={() =>
                              markAsRead(notification.id)
                            }
                            className="p-2 rounded-lg hover:bg-green-50"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4 text-primary" />
                          </button>
                        )}

                        <button
                          onClick={() =>
                            deleteNotification(notification.id)
                          }
                          className="p-2 rounded-lg hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                        </button>

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