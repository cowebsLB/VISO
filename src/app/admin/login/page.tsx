"use client";

import { resolveStaffAuthEmail, STAFF_EMAIL_DOMAIN } from "@/lib/admin/staff-email";
import {
  createSupabaseAnonClient,
  hasSupabaseEnv,
} from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!hasSupabaseEnv()) {
      setError("Supabase is not configured.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createSupabaseAnonClient();
      const email = resolveStaffAuthEmail(emailOrUsername);
      if (!email) {
        setError("Enter your Gmail (or other email) or staff username.");
        return;
      }
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signErr) {
        const msg = signErr.message.toLowerCase();
        if (msg.includes("email not confirmed") || msg.includes("not confirmed")) {
          setError(
            "This account’s email is not confirmed. In Supabase → Authentication → Users, confirm the user or disable “Confirm email” for testing.",
          );
          return;
        }
        if (msg.includes("invalid") || signErr.status === 400) {
          setError(
            `Wrong email or password. Use the same address as in Supabase Authentication (e.g. your Gmail). Short names only work for synthetic staff emails (username@${STAFF_EMAIL_DOMAIN}).`,
          );
          return;
        }
        setError(signErr.message);
        return;
      }
      router.replace("/admin");
    } finally {
      setLoading(false);
    }
  }

  if (!hasSupabaseEnv()) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
        <p className="rounded-xl bg-amber-50 p-4 text-center text-amber-900">
          Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to sign in.
        </p>
        <Link href="/" className="mt-6 text-center text-primary-600 underline">
          Back to site
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <h1 className="font-display text-3xl font-bold text-primary-800">Staff login</h1>
      <p className="mt-2 text-sm text-slate-600">
        Sign in with the <strong>same email</strong> as in Supabase (e.g. Gmail). If you still use synthetic
        staff accounts, a short name maps to{" "}
        <span className="font-mono text-xs">@{STAFF_EMAIL_DOMAIN}</span>.
      </p>
      <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-4">
        <div>
          <label htmlFor="adm-user" className="block text-sm font-medium text-slate-700">
            Email or username
          </label>
          <input
            id="adm-user"
            type="text"
            value={emailOrUsername}
            onChange={(e) => setEmailOrUsername(e.target.value)}
            autoComplete="username"
            placeholder="you@gmail.com"
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-primary-400"
            data-testid="admin-login-user"
          />
        </div>
        <div>
          <label htmlFor="adm-pass" className="block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            id="adm-pass"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-primary-400"
            data-testid="admin-login-password"
          />
        </div>
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-primary-600 py-3 font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
          data-testid="admin-login-submit"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <Link href="/" className="mt-8 text-center text-sm text-primary-600 underline">
        Back to site
      </Link>
    </div>
  );
}
