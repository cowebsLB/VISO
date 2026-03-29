"use client";

import { LOCALES, type LocaleCode } from "@/lib/locale";
import { useLocale } from "@/contexts/LocaleContext";

const labels: Record<LocaleCode, string> = {
  en: "EN",
  ar: "ع",
  hy: "ՀՅ",
};

export function LanguageSwitcher() {
  const { locale, setLocale, messages } = useLocale();

  return (
    <div
      className="flex items-center gap-1 rounded-full border border-primary/20 bg-white/80 p-1 shadow-sm"
      role="group"
      aria-label={messages.common.localeLabel}
    >
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          className={`rounded-full px-2.5 py-1 text-sm font-semibold transition ${
            locale === code
              ? "bg-primary-500 text-white shadow-soft"
              : "text-primary-700 hover:bg-primary-50"
          }`}
        >
          {labels[code]}
        </button>
      ))}
    </div>
  );
}
