export const locales = ["en", "ja", "id", "my"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeLabels: Record<Locale, string> = {
  en: "English",
  ja: "日本語",
  id: "Indonesia",
  my: "မြန်မာ",
};