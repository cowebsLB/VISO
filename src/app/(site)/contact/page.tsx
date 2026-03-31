"use client";

import { useLocale } from "@/contexts/LocaleContext";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import Link from "next/link";

export default function ContactPage() {
  const { messages } = useLocale();
  const t = messages.contact;
  const wa = process.env.NEXT_PUBLIC_WHATSAPP_ORDER_NUMBER ?? "96171408822";
  const mailto =
    "mailto:hello@anushbadar.example.com?subject=Anush%20Badar%20inquiry";

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl font-bold text-primary-600">
        {t.title}
      </h1>

      <div className="mt-10 grid gap-10 md:grid-cols-2">
        <div className="space-y-6 rounded-2xl bg-white p-8 shadow-card ring-1 ring-primary/10">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-primary-500">
              {t.hours}
            </h2>
            <p className="mt-1 text-lg text-slate-800">{t.hoursValue}</p>
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-primary-500">
              {t.phone}
            </h2>
            <a
              href={`tel:+${wa}`}
              className="mt-1 block text-lg font-medium text-primary-700 hover:underline"
            >
              +{wa}
            </a>
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-primary-500">
              {t.email}
            </h2>
            <a
              href={mailto}
              className="mt-1 block text-lg text-primary-700 hover:underline"
            >
              hello@anushbadar.example.com
            </a>
          </div>
          <Link
            href="https://maps.google.com/?q=Beirut+Lebanon"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-full border-2 border-primary-400 px-6 py-3 font-semibold text-primary-700 transition hover:bg-primary-50"
          >
            {t.map}
          </Link>
          <a
            href={buildWhatsAppUrl(wa, "Hello Anush Badar!")}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center rounded-full bg-[#25D366] py-3 font-semibold text-white shadow-soft transition hover:brightness-105"
          >
            {t.whatsappCta}
          </a>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-card ring-1 ring-primary/10">
          <h2 className="font-display text-xl font-semibold text-primary-800">
            {t.formMessage}
          </h2>
          <p className="mt-2 text-sm text-slate-600">{t.formHint}</p>
          <a
            href={mailto}
            className="mt-6 flex w-full items-center justify-center rounded-full bg-primary-500 py-3 font-semibold text-white shadow-soft transition hover:bg-primary-600"
          >
            {t.formSend}
          </a>
        </div>
      </div>
    </div>
  );
}
