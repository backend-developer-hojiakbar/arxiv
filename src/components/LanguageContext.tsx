import { createContext, useContext, useState, ReactNode } from "react";
import { translate, transliterateText } from "../i18n/translate.ts";
import { DEFAULT_LANGUAGE, isLanguage, type Language } from "../i18n/types.ts";

export type { Language } from "../i18n/types.ts";
export { latinToCyrillic, cyrillicToLatin } from "../i18n/transliterate.ts";

interface LanguageContextProps {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (text: string) => string;
  transliterateText: (text: string, to: Language) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem("arxiv_lang");
    if (isLanguage(saved)) return saved;
    return DEFAULT_LANGUAGE;
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("arxiv_lang", newLang);
  };

  const t = (text: string) => translate(text, lang);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, transliterateText }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
}
