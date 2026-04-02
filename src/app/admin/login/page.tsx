"use client";

import { staffEmailFromUsername } from "@/lib/admin/staff-email";
import {
  createSupabaseAnonClient,
  hasSupabaseEnv,
} from "@/lib/supabase/client";
import Link from "next/link";
import { useState } from "react";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
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
      const email = staffEmailFromUsername(username);
      if (!email) {
        setError("Enter your username.");
        return;
      }
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signErr) {
        const msg = signErr.message.toLowerCase();
        if (msg.includes("invalid") || signErr.status === 400) {
          setError("Wrong username or password, or this user is not set up in Supabase Auth.");
        } else {
          setError(signErr.message);
        }
        return;
      }
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
        Internal username and password only — not customer email.
      </p>
      <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-4">
        <div>
          <label htmlFor="adm-user" className="block text-sm font-medium text-slate-700">
            Username
          </label>
          <input
            id="adm-user"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            placeholder="christian"
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
