import { SITE_URL } from "../lib/site";
import { getPublicListingIds } from "../lib/public-listings";

export const revalidate = 3600;

export default async function sitemap() {
  const listings = await getPublicListingIds();
  return [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/como-funciona`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/seguridad`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/terminos`, changeFrequency: "yearly", priority: 0.2 },
    ...listings.map((item) => ({
      url: `${SITE_URL}/anuncio/${item.id}`,
      lastModified: item.updatedAt ? new Date(item.updatedAt) : undefined,
      changeFrequency: "weekly",
      priority: 0.8,
    })),
  ];
}
