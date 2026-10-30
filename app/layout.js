import "./globals.css";
import { Toaster } from "../components/ui/sonner";
import { SITE_URL } from "../lib/site";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  openGraph: { siteName: "iMarket", locale: "es_CU", type: "website" },
  title: "iMarket — Tu próximo iPhone está aquí",
  description:
    "El punto de encuentro entre tu próximo iPhone y tú. Compra y vende iPhones de persona a persona en La Habana.",
};
export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <Toaster richColors closeButton />
      </body>
    </html>
  );
}
