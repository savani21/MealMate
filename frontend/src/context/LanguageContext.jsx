import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";

const LanguageContext = createContext(null);
const SUPPORTED_LANGUAGES = ["en", "gu", "hi"];

function getPreferenceKey(user) {
  const id = user?._id || user?.id || user?.email;
  return id ? `mealmate:language:${id}` : null;
}

export function LanguageProvider({ children }) {
  const { user } = useAuth();
  const [language, setLanguageState] = useState("en");
  const [needsSelection, setNeedsSelection] = useState(false);

  useEffect(() => {
    const key = getPreferenceKey(user);
    if (!key) {
      setLanguageState("en");
      setNeedsSelection(false);
      return;
    }

    const saved = localStorage.getItem(key);
    const accountLanguage = user?.preferences?.language;
    const preferred = SUPPORTED_LANGUAGES.includes(accountLanguage) ? accountLanguage : saved;
    if (SUPPORTED_LANGUAGES.includes(preferred)) {
      setLanguageState(preferred);
      setNeedsSelection(false);
      if (preferred !== accountLanguage) {
        localStorage.setItem(key, preferred);
      }
    } else {
      setLanguageState("en");
      setNeedsSelection(true);
    }
  }, [user]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback(async (nextLanguage) => {
    if (!SUPPORTED_LANGUAGES.includes(nextLanguage)) return;
    const key = getPreferenceKey(user);
    if (key) localStorage.setItem(key, nextLanguage);
    setLanguageState(nextLanguage);
    setNeedsSelection(false);

    const token = localStorage.getItem("token");
    if (user && token) {
      try {
        const response = await fetch("/api/auth/preferences/language", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ language: nextLanguage }),
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          console.warn("Language preference was saved locally but not to the account:", data.message || response.status);
        }
      } catch (error) {
        console.warn("Language preference was saved locally but account sync failed:", error);
      }
    }
  }, [user]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    needsSelection,
    languages: [
      { code: "en", label: "English", nativeLabel: "English" },
      { code: "gu", label: "Gujarati", nativeLabel: "ગુજરાતી" },
      { code: "hi", label: "Hindi", nativeLabel: "हिन्दी" },
    ],
  }), [language, setLanguage, needsSelection]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider.");
  return context;
}
