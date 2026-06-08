export type Language = "cyrillic" | "latin" | "russian" | "english";

export const LANGUAGES: { id: Language; label: string }[] = [
  { id: "cyrillic", label: "Ўзбек" },
  { id: "latin", label: "Lotin" },
  { id: "russian", label: "Русский" },
  { id: "english", label: "English" },
];

export const DEFAULT_LANGUAGE: Language = "cyrillic";

export function isLanguage(value: string | null): value is Language {
  return value === "cyrillic" || value === "latin" || value === "russian" || value === "english";
}
