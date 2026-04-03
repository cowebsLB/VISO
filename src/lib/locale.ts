export type LocaleCode = "en" | "ar" | "hy";

export const LOCALES: LocaleCode[] = ["en", "ar", "hy"];

/** Current key; legacy `viso-locale` is migrated on read in LocaleProvider. */
export const LOCALE_STORAGE_KEY = "anushbadar-locale";
export const LOCALE_STORAGE_LEGACY_KEY = "viso-locale";

export function isLocale(s: string | null): s is LocaleCode {
  return s === "en" || s === "ar" || s === "hy";
}

export function localeFromNavigator(): LocaleCode {
  if (typeof navigator === "undefined") return "en";
  const lang = navigator.language.slice(0, 2).toLowerCase();
  if (lang === "ar") return "ar";
  if (lang === "hy") return "hy";
  return "en";
}
