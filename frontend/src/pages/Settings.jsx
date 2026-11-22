import AppNavbar from "@/components/AppNavbar";
import PageHeroBanner from "@/components/PageHeroBanner";
import { useEffect, useState } from "react";
import { Settings as SettingsIcon, Bell, Moon, Save, RotateCcw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Languages } from "lucide-react";

export default function Settings() {
  const { user, updateTheme } = useAuth();
  const { language, setLanguage, languages } = useLanguage();
  const [notifications, setNotifications] = useState(localStorage.getItem("notifications") !== "false");
  const [darkMode, setDarkMode] = useState(user?.preferences?.theme === "dark");
  const [savingTheme, setSavingTheme] = useState(false);
  const [themeError, setThemeError] = useState("");

  useEffect(() => {
    setDarkMode(user?.preferences?.theme === "dark");
  }, [user?._id, user?.preferences?.theme]);

  const handleThemeChange = async () => {
    const nextTheme = darkMode ? "light" : "dark";
    setSavingTheme(true);
    setThemeError("");
    try {
      await updateTheme(nextTheme);
      setDarkMode(nextTheme === "dark");
    } catch (error) {
      setThemeError(error.message || "Could not save your theme preference.");
    } finally {
      setSavingTheme(false);
    }
  };

  const saveSettings = () => {
    localStorage.setItem("notifications", String(notifications));
    alert("Settings saved successfully");
  };

  const resetSettings = async () => {
    setNotifications(true);
    localStorage.setItem("notifications", "true");
    setSavingTheme(true);
    setThemeError("");
    try {
      await updateTheme("light");
      setDarkMode(false);
      alert("Settings reset successfully");
    } catch (error) {
      setThemeError(error.message || "Could not reset your theme preference.");
    } finally {
      setSavingTheme(false);
    }
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
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center"><Languages className="w-5 h-5 text-primary" /></div>
              <div className="min-w-0 flex-1">
                <h2 className="font-bold text-gray-900 dark:text-slate-100">Language</h2>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Choose the language used throughout MealMate.</p>
              </div>
              <select value={language} onChange={(event) => setLanguage(event.target.value)} aria-label="Choose language" className="max-w-[130px] rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 dark:bg-slate-800 dark:text-slate-100">
                {languages.map((item) => <option key={item.code} value={item.code}>{item.nativeLabel}</option>)}
              </select>
            </div>
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
                  <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">This preference is saved to your account and only applies while you are logged in.</p>
                </div>
              </div>
              <button type="button" role="switch" aria-checked={darkMode} aria-label="Toggle dark mode" disabled={savingTheme} onClick={handleThemeChange} className={"relative w-12 h-6 rounded-full transition disabled:opacity-60 " + (darkMode ? "bg-primary" : "bg-gray-300")}>
                <span className={"absolute top-1 w-4 h-4 bg-white rounded-full transition " + (darkMode ? "left-7" : "left-1")} />
              </button>
            </div>
            {themeError && <p role="alert" className="mt-3 text-sm text-red-600">{themeError}</p>}
          </div>
          <div className="p-6 md:p-8 flex flex-col sm:flex-row gap-3">
            <button type="button" onClick={saveSettings} className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-semibold hover:opacity-90 transition"><Save className="w-5 h-5" />Save Settings</button>
            <button type="button" disabled={savingTheme} onClick={resetSettings} className="flex-1 flex items-center justify-center gap-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 py-3 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-slate-700 transition disabled:opacity-60"><RotateCcw className="w-5 h-5" />Reset</button>
          </div>
        </div>
      </main>
    </div>
  );
}
