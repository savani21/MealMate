import { Languages } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function LanguageSwitcher() {
  const { language, setLanguage, languages } = useLanguage();

  return (
    <label className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700">
      <Languages className="h-4 w-4 text-primary" />
      <span className="sr-only">Choose language</span>
      <select value={language} onChange={(event) => setLanguage(event.target.value)} aria-label="Choose language"
        className="max-w-[112px] cursor-pointer bg-transparent text-sm font-semibold outline-none">
        {languages.map((item) => <option key={item.code} value={item.code}>{item.nativeLabel}</option>)}
      </select>
    </label>
  );
}
