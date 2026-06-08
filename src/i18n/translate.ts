import { cyrillicTranslations } from "./cyrillic.ts";
import { englishTranslations } from "./english.ts";
import { russianTranslations } from "./russian.ts";
import { cyrillicToLatin, latinToCyrillic } from "./transliterate.ts";
import type { Language } from "./types.ts";

const dictionaries: Record<Exclude<Language, "latin">, Record<string, string>> = {
  cyrillic: cyrillicTranslations,
  russian: russianTranslations,
  english: englishTranslations,
};

function lookupDictionary(dict: Record<string, string>, text: string): string | undefined {
  const trimmed = text.trim();
  if (dict[trimmed] !== undefined) return dict[trimmed];

  const matchSuffixClean = trimmed.replace(/[\s:*()\-+]+$/, "");
  if (matchSuffixClean && dict[matchSuffixClean] !== undefined) {
    const main = dict[matchSuffixClean];
    const difference = trimmed.substring(matchSuffixClean.length);
    return main + difference;
  }

  return undefined;
}

export function translate(text: string, lang: Language): string {
  if (!text) return "";

  if (lang === "latin") {
    return text;
  }

  const dict = dictionaries[lang];
  const match = lookupDictionary(dict, text);
  if (match !== undefined) return match;

  if (lang === "cyrillic") {
    return latinToCyrillic(text);
  }

  const latinMatch = lookupDictionary(englishTranslations, text)
    ?? lookupDictionary(russianTranslations, text);
  if (latinMatch !== undefined) return latinMatch;

  return latinToCyrillic(text);
}

export function transliterateText(text: string, targetLang: Language): string {
  if (!text) return "";
  if (targetLang === "latin") return cyrillicToLatin(text);
  if (targetLang === "cyrillic") return latinToCyrillic(text);
  return translate(text, targetLang);
}
