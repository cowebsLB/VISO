"use client";

import {
  LOCALE_STORAGE_KEY,
  LOCALE_STORAGE_LEGACY_KEY,
  type LocaleCode,
  isLocale,
  localeFromNavigator,
} from "@/lib/locale";
import { getMessages, type Messages } from "@/locales/messages";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type LocaleContextValue = {
  locale: LocaleCode;
  messages: Messages;
  setLocale: (locale: LocaleCode) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function readStoredLocale(): LocaleCode | null {
  if (typeof window === "undefined") return null;
  try {
    let raw = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (raw == null) {
      raw = localStorage.getItem(LOCALE_STORAGE_LEGACY_KEY);
      if (raw != null && isLocale(raw)) {
        try {
          localStorage.setItem(LOCALE_STORAGE_KEY, raw);
          localStorage.removeItem(LOCALE_STORAGE_LEGACY_KEY);
        } catch {
          /* ignore */
        }
      }
    }
    return raw && isLocale(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = readStoredLocale();
    setLocaleState(stored ?? localeFromNavigator());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      /* ignore */
    }
  }, [locale, mounted]);

  const setLocale = useCallback((next: LocaleCode) => {
    setLocaleState(next);
  }, []);

  const messages = useMemo(() => getMessages(locale), [locale]);

  const value = useMemo(
    () => ({ locale, messages, setLocale }),
    [locale, messages, setLocale],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}
