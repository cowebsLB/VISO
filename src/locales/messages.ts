import type { LocaleCode } from "@/lib/locale";
import ar from "./ar.json";
import en from "./en.json";
import hy from "./hy.json";

export type Messages = typeof en;

const bundles: Record<LocaleCode, Messages> = {
  en: en as Messages,
  ar: ar as Messages,
  hy: hy as Messages,
};

export function getMessages(locale: LocaleCode): Messages {
  return bundles[locale];
}
