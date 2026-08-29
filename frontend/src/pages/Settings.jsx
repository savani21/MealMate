import { useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  Settings as SettingsIcon,
  Bell,
  Moon,
  Save,
  RotateCcw,
} from "lucide-react";

export default function Settings() {
  const [, setLocation] = useLocation();

  const [notifications, setNotifications] = useState(
    localStorage.getItem("notifications") !== "false"
  );

  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("darkMode") === "true"
  );

  const saveSettings = () => {
    localStorage.setItem(
      "notifications",
      notifications
    );

    localStorage.setItem(
      "darkMode",
      darkMode
    );

    alert("Settings saved successfully");
  };

  const resetSettings = () => {
    setNotifications(true);
    setDarkMode(false);

    localStorage.setItem("notifications", "true");
    localStorage.setItem("darkMode", "false");

    alert("Settings reset successfully");
  };

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
              <SettingsIcon className="w-6 h-6 text-primary" />

              <span className="text-xl font-black text-gray-900">
                Settings
              </span>
            </div>

          </div>

        </div>

      </header>


      {/* MAIN */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">

          {/* TITLE */}
          <div className="p-6 md:p-8 border-b border-gray-100">

            <p className="text-primary text-sm font-semibold uppercase tracking-wide">
              Preferences
            </p>

            <h1 className="text-2xl md:text-3xl font-black text-gray-900 mt-1">
              App Settings
            </h1>

            <p className="text-gray-500 mt-2">
              Customize your MealMate experience.
            </p>

          </div>


          {/* NOTIFICATIONS */}
          <div className="p-6 md:p-8 border-b border-gray-100">

            <div className="flex items-center justify-between gap-4">

              <div className="flex items-center gap-4">

                <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-primary" />
                </div>

                <div>
                  <h2 className="font-bold text-gray-900">
                    Notifications
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    Receive MealMate notifications.
                  </p>
                </div>

              </div>

              <button
                onClick={() =>
                  setNotifications(!notifications)
                }
                className={`relative w-12 h-6 rounded-full transition ${
                  notifications
                    ? "bg-primary"
                    : "bg-gray-300"
                }`}
              >

                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition ${
                    notifications
                      ? "left-7"
                      : "left-1"
                  }`}
                />

              </button>

            </div>

          </div>


          {/* DARK MODE */}
          <div className="p-6 md:p-8 border-b border-gray-100">

            <div className="flex items-center justify-between gap-4">

              <div className="flex items-center gap-4">

                <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center">
                  <Moon className="w-5 h-5 text-primary" />
                </div>

                <div>
                  <h2 className="font-bold text-gray-900">
                    Dark Mode
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    Use a darker appearance.
                  </p>
                </div>

              </div>

              <button
                onClick={() =>
                  setDarkMode(!darkMode)
                }
                className={`relative w-12 h-6 rounded-full transition ${
                  darkMode
                    ? "bg-primary"
                    : "bg-gray-300"
                }`}
              >

                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition ${
                    darkMode
                      ? "left-7"
                      : "left-1"
                  }`}
                />

              </button>

            </div>

          </div>


          {/* ACTIONS */}
          <div className="p-6 md:p-8 flex flex-col sm:flex-row gap-3">

            <button
              onClick={saveSettings}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-semibold hover:opacity-90 transition"
            >
              <Save className="w-5 h-5" />
              Save Settings
            </button>

            <button
              onClick={resetSettings}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
            >
              <RotateCcw className="w-5 h-5" />
              Reset
            </button>

          </div>

        </div>

      </main>

    </div>
  );
}