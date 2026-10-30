import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, MapPin } from "lucide-react";
import { SITE_URL } from "../../../lib/site";
import { getPublicListing } from "../../../lib/public-listings";
import { COSMETIC_ISSUES } from "../../../lib/catalog.mjs";
import ShareButton from "../../../components/share-button";

export const revalidate = 300;

const cosmetic = Object.fromEntries(COSMETIC_ISSUES);
const batteryLabel = (item) =>
  item.originalBattery
    ? "Original"
    : item.batteryType === "replaced_original"
      ? "Reemplazada (original)"
      : item.batteryType === "unknown"
        ? "Sin confirmar"
        : "Reemplazada (genérica)";
const heading = (item) => `${item.model} ${item.storage} GB ${item.color}`;

export async function generateMetadata({ params }) {
  const { id } = await params;
  const item = await getPublicListing(id);
  if (!item) return { title: "Anuncio no disponible | iMarket", robots: { index: false } };
  const title = `${heading(item)} en La Habana | iMarket`;
  const description = `${item.model} de ${item.storage} GB, ${item.color}, estado ${item.condition.toLowerCase()}${
    item.battery ? `, batería ${item.battery}%` : ""
  }. $${item.price} USD en ${item.location}, La Habana. Vendedor verificado en iMarket.`;
  const url = `${SITE_URL}/anuncio/${item.id}`;
  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: "iMarket",
      locale: "es_CU",
      title,
      description,
      url,
      images: item.photos.slice(0, 1),
    },
    twitter: { card: "summary_large_image", title, description, images: item.photos.slice(0, 1) },
  };
}

export default async function ListingPage({ params }) {
  const { id } = await params;
  const item = await getPublicListing(id);
  if (!item) notFound();
  const url = `${SITE_URL}/anuncio/${item.id}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: heading(item),
    description: item.description,
    image: item.photos,
    brand: { "@type": "Brand", name: "Apple" },
    color: item.color,
    itemCondition: "https://schema.org/UsedCondition",
    url,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "USD",
      price: item.price,
      availability: "https://schema.org/InStock",
      areaServed: "La Habana, Cuba",
    },
  };
  const specs = [
    ["Almacenamiento", `${item.storage} GB`],
    ["Color", item.color],
    ["Estado", item.condition],
    ["Batería", `${item.battery == null ? "Sin informar" : `${item.battery}%`} · ${batteryLabel(item)}`],
    ["Libre de fábrica", item.factoryUnlocked ? "Sí" : "No"],
    ["Face ID", item.faceId ? "Funciona" : "No funciona"],
    ["True Tone", item.trueTone ? "Funciona" : "No funciona"],
    ["Garantía", item.warrantyDays > 0 ? `${item.warrantyDays} días` : "Sin garantía"],
  ];
  return (
    <div className="static-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <header className="static-header">
        <Link href="/" className="auth-brand">
          <img src="/brand/logo-icon.png" alt="" width="30" height="30" className="auth-brand-logo" />
          iMarket
        </Link>
        <Link href="/" className="back-link"><ArrowLeft size={15} /> Ver más iPhone</Link>
      </header>
      <main className="static-content ad-page">
        <h1>{heading(item)}</h1>
        <p className="ad-price">
          ${item.price} <small>USD</small>
          {item.negotiable ? <span> · Negociable</span> : null}
          {item.acceptsTrade ? <span> · Acepta intercambio</span> : null}
        </p>
        <p className="muted ad-location">
          <MapPin size={15} /> {item.location}, La Habana
        </p>
        <div className="ad-photos">
          {item.photos.map((photo, index) => (
            <img
              key={photo}
              src={photo}
              alt={`${heading(item)} — foto ${index + 1}`}
              loading={index === 0 ? "eager" : "lazy"}
            />
          ))}
        </div>
        <div className="ad-actions">
          <Link href={`/?anuncio=${item.id}`} className="ad-cta">Contactar al vendedor</Link>
          <ShareButton id={item.id} title={heading(item)} />
        </div>
        <h2>Descripción</h2>
        <p>{item.description}</p>
        {item.details ? (
          <>
            <h2>Detalles del dispositivo</h2>
            <p>{item.details}</p>
          </>
        ) : null}
        {item.cosmeticIssues?.length > 0 && (
          <>
            <h2>Daños estéticos</h2>
            <div className="cosmetic-tags">
              {item.cosmeticIssues.map((key) => (
                <span key={key}>{cosmetic[key] || key}</span>
              ))}
            </div>
          </>
        )}
        <h2>Características</h2>
        <dl className="ad-specs">
          {specs.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <p className="muted ad-seller">
          Vendido por <strong>{item.seller}</strong>
          {item.verified ? <BadgeCheck size={15} className="verified-icon" /> : null} · En iMarket desde {item.joined}
        </p>
      </main>
    </div>
  );
}
