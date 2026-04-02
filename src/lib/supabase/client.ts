import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** One browser client so GoTrue (auth) is not duplicated on the same storage key. */
let browserSingleton: SupabaseClient | null = null;

/** Browser / shared anon client (RLS applies). Reuses the same instance. */
export function createSupabaseAnonClient(): SupabaseClient {
  if (!url || !anon) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  if (!browserSingleton) {
    browserSingleton = createClient(url, anon);
  }
  return browserSingleton;
}

export function hasSupabaseEnv(): boolean {
  return Boolean(url && anon);
}
