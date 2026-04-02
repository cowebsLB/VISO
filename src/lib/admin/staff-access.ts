import { createSupabaseAnonClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

export type StaffAccess =
  | { ok: true; supabase: SupabaseClient }
  | { ok: false; message: string };

/**
 * Orders, order_items, and most admin tables use RLS with public.is_admin().
 * is_admin() is true only when auth.uid() exists in public.admins.
 * Without a staff row, queries succeed but return no rows — this helper surfaces that.
 */
export async function getStaffSupabase(): Promise<StaffAccess> {
  const supabase = createSupabaseAnonClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return {
      ok: false,
      message: "Session not ready. Try refreshing the page or sign in again.",
    };
  }
  const { data: staff } = await supabase.from("admins").select("user_id").maybeSingle();
  if (!staff) {
    return {
      ok: false,
      message:
        "Your account is not linked as staff, so orders stay hidden. Add your user id to public.admins in Supabase (see docs/seed-admins.md).",
    };
  }
  return { ok: true, supabase };
}
