import { getSupabase } from "./supabase";

export async function isCurrentUserAdmin(client = getSupabase()) {
  if (!client) return false;
  const { data, error } = await client.rpc("imarket_is_admin");
  if (error) return false;
  return Boolean(data);
}

export async function ensureProfile(client, user) {
  if (!client || !user) return null;
  const name = String(user.user_metadata?.name || user.user_metadata?.display_name || user.email?.split("@")[0] || "Propietario").trim().slice(0, 60);
  const { data: existing, error: readError } = await client.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (readError) throw readError;
  if (existing) return existing;
  const { data, error } = await client.from("profiles").insert({ id: user.id, display_name: name.length >= 2 ? name : "Propietario" }).select("*").single();
  if (error && error.code !== "23505") throw error;
  if (data) return data;
  return (await client.from("profiles").select("*").eq("id", user.id).single()).data;
}
