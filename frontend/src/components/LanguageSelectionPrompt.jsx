import { Languages } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function LanguageSelectionPrompt() {
  const { needsSelection, language, setLanguage, languages } = useLanguage();
  if (!needsSelection) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="language-selection-title">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-primary">
          <Languages className="h-7 w-7" />
        </div>
        <h2 id="language-selection-title" className="text-center text-2xl font-black text-gray-900">Choose your language</h2>
        <p className="mt-2 text-center text-sm text-gray-500">Select the language you prefer to use in MealMate. You can change it later.</p>
        <div className="mt-6 space-y-3">
          {languages.map((item) => (
            <button key={item.code} type="button" onClick={() => setLanguage(item.code)} aria-pressed={language === item.code}
              className={`flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left transition ${language === item.code ? "border-primary bg-green-50" : "border-gray-200 hover:border-green-300 hover:bg-gray-50"}`}>
              <span>
                <span className="block font-bold text-gray-900">{item.nativeLabel}</span>
                <span className="mt-0.5 block text-xs text-gray-500">{item.label}</span>
              </span>
              <span className={`h-5 w-5 rounded-full border-2 ${language === item.code ? "border-primary bg-primary ring-4 ring-green-100" : "border-gray-300"}`} />
            </button>
          ))}
        </div>
        <p className="mt-5 text-center text-xs text-gray-400">Your selection is saved for this account on this device.</p>
      </div>
    </div>
  );
}
