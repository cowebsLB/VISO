import { createSupabaseAnonClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

export type StaffAccess =
  | { ok: true; supabase: SupabaseClient }
  | { ok: false; message: string };

/**
 * Orders, order_items, and most admin tables use RLS with public.is_admin().
 * is_admin() is true only when auth.uid() exists in public.admins.
 * Without a staff row, RLS often hides rows or blocks writes — this helper surfaces that.
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

  // Filter by user_id: admins can SELECT all rows via RLS; unfiltered + maybeSingle() errors → false “not staff”.
  const userId = session.user.id;
  const { data: staff, error } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      message: `Could not verify staff (${error.message}). Refresh the page or see docs/seed-admins.md.`,
    };
  }

  if (!staff) {
    return {
      ok: false,
      message:
        "Your account is not linked as staff. Add your user id to public.admins in Supabase (see docs/seed-admins.md).",
    };
  }
  return { ok: true, supabase };
}
