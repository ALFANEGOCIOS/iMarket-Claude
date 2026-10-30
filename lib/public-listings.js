// Lectura pública (servidor) de anuncios para SEO: página de anuncio y sitemap.
import { createClient } from "@supabase/supabase-js";
import { createRepository } from "./database.mjs";
import { isUuid } from "./site.js";

function repository() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createRepository(
    createClient(url, key, { auth: { persistSession: false } }),
  );
}

export async function getPublicListing(id) {
  if (!isUuid(id)) return null;
  try {
    return (await repository()?.listing(id)) || null;
  } catch {
    return null;
  }
}

export async function getPublicListingIds(limit = 1000) {
  try {
    return (await repository()?.publicListingIds(limit)) || [];
  } catch {
    return [];
  }
}
