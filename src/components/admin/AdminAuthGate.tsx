"use client";

import {
  createSupabaseAnonClient,
  hasSupabaseEnv,
} from "@/lib/supabase/client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

function isAdminLoginPath(pathname: string | null): boolean {
  if (!pathname) return false;
  const p = pathname.replace(/\/+$/, "") || "/";
  return p === "/admin/login";
}

export function AdminAuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const isLogin = isAdminLoginPath(pathname ?? null);

  useEffect(() => {
    if (!hasSupabaseEnv()) {
      setReady(true);
      return;
    }
    const supabase = createSupabaseAnonClient();
    let cancelled = false;

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (!session && !isLogin) {
        router.replace("/admin/login");
        setReady(true);
        return;
      }
      if (session && isLogin) {
        router.replace("/admin");
        setReady(true);
        return;
      }
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!hasSupabaseEnv()) return;
      if (session && isLogin) {
        router.replace("/admin");
        return;
      }
      if (!session && !isLogin) router.replace("/admin/login");
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [isLogin, pathname, router]);

  if (!hasSupabaseEnv() && !isLogin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="rounded-xl bg-amber-50 p-4 text-amber-900">
          Admin requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
        </p>
      </div>
    );
  }

  if (!ready && !isLogin) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-600">
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}
