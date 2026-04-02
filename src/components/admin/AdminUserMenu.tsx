"use client";

import { createSupabaseAnonClient, hasSupabaseEnv } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function AdminUserMenu() {
  const router = useRouter();

  async function signOut() {
    if (!hasSupabaseEnv()) return;
    const supabase = createSupabaseAnonClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
  }

  if (!hasSupabaseEnv()) return null;

  return (
    <button
      type="button"
      onClick={() => void signOut()}
      className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
    >
      Sign out
    </button>
  );
}
