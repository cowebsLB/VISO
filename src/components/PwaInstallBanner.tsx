"use client";

import { BRAND_NAME } from "@/lib/brand";
import { useEffect, useState } from "react";

const DISMISS_KEY = "pwa-install-banner-dismissed-at";
const DISMISS_MS = 30 * 24 * 60 * 60 * 1000;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isDismissedRecently(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const t = Number.parseInt(raw, 10);
    if (Number.isNaN(t)) return false;
    return Date.now() - t < DISMISS_MS;
  } catch {
    return false;
  }
}

function isRunningAsInstalledApp(): boolean {
  if (typeof window === "undefined") return true;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return Boolean(nav.standalone);
}

/** All iOS browsers use WebKit; none fire `beforeinstallprompt` — install is via Share → Add to Home Screen. */
function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function PwaInstallBanner() {
  const [mode, setMode] = useState<"hidden" | "android" | "ios">("hidden");
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );

  useEffect(() => {
    if (isRunningAsInstalledApp() || isDismissedRecently()) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setMode("android");
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // In dev, Chrome’s device toolbar spoofs iPhone UA — the iOS hint is noisy on localhost.
    // Real iOS users still see this on the deployed site (production).
    const isDev = process.env.NODE_ENV === "development";
    if (!isDev && isIosDevice()) {
      setMode((prev) => (prev === "android" ? prev : "ios"));
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
    };
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setMode("hidden");
    setDeferred(null);
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setMode("hidden");
  }

  if (mode === "hidden") return null;

  return (
    <>
      <div className="h-28 shrink-0" aria-hidden />
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/90 bg-slate-50/95 px-4 py-3 shadow-[0_-4px_24px_rgba(15,23,42,0.06)] backdrop-blur supports-[padding:max(0px)]:pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        role="region"
        aria-label="Install web app"
      >
      <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {mode === "android" && deferred ? (
          <>
            <p className="text-sm text-slate-700">
              <span className="font-semibold text-slate-900">{BRAND_NAME}</span>
              {" — "}
              Install for a full-screen app and faster return visits.
            </p>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                className="rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
                onClick={() => void install()}
              >
                Install
              </button>
              <button
                type="button"
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={dismiss}
              >
                Not now
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm leading-snug text-slate-600">
              <span className="font-semibold text-slate-800">Add to Home Screen</span>
              {" — "}
              Tap <span className="font-medium text-slate-700">Share</span>
              {" → "}
              <span className="font-medium text-slate-700">Add to Home Screen</span>
              {" "}
              <span className="text-slate-500">
                (iOS does not offer an install banner like Android.)
              </span>
            </p>
            <button
              type="button"
              className="shrink-0 self-start rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-100 sm:self-center"
              onClick={dismiss}
            >
              OK
            </button>
          </>
        )}
      </div>
    </div>
    </>
  );
}
