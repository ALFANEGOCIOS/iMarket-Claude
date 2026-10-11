import { createClient } from "@supabase/supabase-js";
let client;
export function isLiveMode() {
  if (process.env.NEXT_PUBLIC_APP_MODE === "live") return true;
  if (process.env.NEXT_PUBLIC_APP_MODE === "demo") return false;
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
export function getSupabase() {
  if (!isLiveMode()) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  client ??= createClient(url, key);
  return client;
}
