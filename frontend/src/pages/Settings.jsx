import AppNavbar from "@/components/AppNavbar";
import PageHeroBanner from "@/components/PageHeroBanner";
import { useEffect, useState } from "react";
import { Settings as SettingsIcon, Bell, Moon, Save, RotateCcw } from "lucide-react";

export default function Settings() {
  const [notifications, setNotifications] = useState(localStorage.getItem("notifications") !== "false");
  const [darkMode, setDarkMode] = useState(localStorage.getItem("darkMode") === "true");

  // Apply theme immediately and preserve it when navigating between pages.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("darkMode", String(darkMode));
  }, [darkMode]);

  const saveSettings = () => {
    localStorage.setItem("notifications", String(notifications));
    localStorage.setItem("darkMode", String(darkMode));
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
    <div className="min-h-screen bg-[#f7faf7] dark:bg-slate-950 dark:text-slate-100">
      <AppNavbar />
      <PageHeroBanner title="Settings & Preferences" description="Customize how MealMate works for you." eyebrow="PREFERENCES" icon={SettingsIcon} />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 border-b border-gray-100 dark:border-slate-700">
            <p className="text-primary text-sm font-semibold uppercase tracking-wide">Preferences</p>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-slate-100 mt-1">App Settings</h1>
            <p className="text-gray-500 dark:text-slate-400 mt-2">Customize your MealMate experience.</p>
          </div>
          <div className="p-6 md:p-8 border-b border-gray-100 dark:border-slate-700">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center"><Bell className="w-5 h-5 text-primary" /></div>
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-slate-100">Notifications</h2>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Receive MealMate notifications.</p>
                </div>
              </div>
              <button type="button" role="switch" aria-checked={notifications} aria-label="Toggle notifications" onClick={() => setNotifications(value => !value)} className={"relative w-12 h-6 rounded-full transition " + (notifications ? "bg-primary" : "bg-gray-300")}>
                <span className={"absolute top-1 w-4 h-4 bg-white rounded-full transition " + (notifications ? "left-7" : "left-1")} />
              </button>
            </div>
          </div>
          <div className="p-6 md:p-8 border-b border-gray-100 dark:border-slate-700">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center"><Moon className="w-5 h-5 text-primary" /></div>
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-slate-100">Dark Mode</h2>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Switch between light and dark appearance.</p>
                </div>
              </div>
              <button type="button" role="switch" aria-checked={darkMode} aria-label="Toggle dark mode" onClick={() => setDarkMode(value => !value)} className={"relative w-12 h-6 rounded-full transition " + (darkMode ? "bg-primary" : "bg-gray-300")}>
                <span className={"absolute top-1 w-4 h-4 bg-white rounded-full transition " + (darkMode ? "left-7" : "left-1")} />
              </button>
            </div>
          </div>
          <div className="p-6 md:p-8 flex flex-col sm:flex-row gap-3">
            <button type="button" onClick={saveSettings} className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-semibold hover:opacity-90 transition"><Save className="w-5 h-5" />Save Settings</button>
            <button type="button" onClick={resetSettings} className="flex-1 flex items-center justify-center gap-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 py-3 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-slate-700 transition"><RotateCcw className="w-5 h-5" />Reset</button>
          </div>
        </div>
      </main>
    </div>
  );
}
