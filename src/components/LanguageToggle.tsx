import { Languages } from "lucide-react";
import { LANGUAGES } from "../i18n/types.ts";
import type { Language } from "../i18n/types.ts";

const SHORT_LABELS: Record<Language, string> = {
  cyrillic: "Ўзб",
  latin: "Lot",
  russian: "Рус",
  english: "EN",
};

interface LanguageToggleProps {
  lang: Language;
  setLang: (lang: Language) => void;
  compact?: boolean;
}

export default function LanguageToggle({ lang, setLang, compact }: LanguageToggleProps) {
  return (
    <div className={`flex items-center border border-slate-200 rounded-lg bg-slate-50 p-0.5 ${compact ? "text-[10px]" : "text-xs"}`}>
      {!compact && (
        <span className="text-slate-500 font-medium px-2 flex items-center gap-1">
          <Languages className="w-3.5 h-3.5" />
        </span>
      )}
      {LANGUAGES.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => setLang(id)}
          title={label}
          className={`px-1.5 sm:px-2 py-1 rounded-md transition-all cursor-pointer font-medium whitespace-nowrap ${
            lang === id ? "bg-primary-600 text-white" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {compact ? SHORT_LABELS[id] : label}
        </button>
      ))}
    </div>
  );
}
