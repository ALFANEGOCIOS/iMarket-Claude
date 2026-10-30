// Dirección pública de la web (para enlaces compartibles, sitemap y SEO).
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://imarketcuba.vercel.app"
).replace(/\/+$/, "");
export const isUuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    String(value || ""),
  );
