import Link from "next/link";
import {
  ShieldCheck, Smartphone, MessageCircle, Camera, MapPin,
  BadgeCheck, Handshake, Star, ArrowLeft,
} from "lucide-react";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";

export const metadata = {
  title: "Cómo funciona | iMarket",
  description:
    "Cómo comprar y vender iPhones de forma segura en iMarket, de persona a persona en La Habana.",
};

const sellerSteps = [
  {
    icon: ShieldCheck,
    title: "1. Verifica tu identidad",
    text: "Antes de publicar, confirmamos que eres una persona real con una selfie y tu carnet de identidad. Es un paso único; después de aprobado, publicas cuando quieras.",
  },
  {
    icon: Camera,
    title: "2. Publica tu iPhone",
    text: "Sube hasta 5 fotos reales, el modelo, capacidad, color, precio y el estado real de la batería. Mientras más honesto seas, más rápido se vende.",
  },
  {
    icon: BadgeCheck,
    title: "3. El equipo revisa tu anuncio",
    text: "Antes de salir al catálogo público, un administrador revisa que la información sea coherente y las fotos correspondan a un iPhone real. Esto protege a los compradores de anuncios falsos.",
  },
  {
    icon: MessageCircle,
    title: "4. Conversa con interesados",
    text: "Los compradores te escriben directamente dentro de iMarket. Tu número de teléfono se mantiene privado hasta que tú decides compartirlo.",
  },
  {
    icon: Handshake,
    title: "5. Acuerden la entrega y marca la venta",
    text: "Cuando cierres el trato, márcalo como vendido y vincula al comprador (si conversó contigo por la app). Así ambos pueden calificar la experiencia.",
  },
];

const buyerSteps = [
  {
    icon: Smartphone,
    title: "1. Busca y filtra",
    text: "Filtra por modelo, precio, municipio, salud de batería o solo vendedores verificados. Cada anuncio muestra el estado real del equipo.",
  },
  {
    icon: MessageCircle,
    title: "2. Pregunta antes de ir",
    text: "Escríbele al vendedor desde la publicación: confirma disponibilidad, estado del iCloud y acuerda dónde encontrarse.",
  },
  {
    icon: MapPin,
    title: "3. Revisa el equipo en persona",
    text: "Encuéntrense en un lugar público. Comprueba el IMEI, que no tenga bloqueo de iCloud/Buscar, y que encienda y funcione como se describe antes de pagar.",
  },
  {
    icon: Star,
    title: "4. Confirma la compra y califica",
    text: "Si el vendedor te vinculó a la venta, confirma la compra desde tu cuenta — así ayudas a construir su reputación para los próximos compradores.",
  },
];

export default function ComoFuncionaPage() {
  return (
    <div className="static-page">
      <header className="static-header">
        <Link href="/" className="auth-brand">
          <img src="/brand/logo-icon.png" alt="" width="30" height="30" className="auth-brand-logo" />
          iMarket
        </Link>
        <Link href="/" className="back-link">
          <ArrowLeft size={15} /> Volver al inicio
        </Link>
      </header>

      <main className="static-content">
        <Badge variant="outline">Cómo funciona</Badge>
        <h1>Comprar y vender iPhones, de persona a persona en La Habana</h1>
        <p className="lead">
          iMarket conecta directamente a quien tiene un iPhone para vender con
          quien lo está buscando. No somos una tienda ni manejamos el pago:
          solo hacemos que encontrarse y confiar el uno en el otro sea más
          fácil y más seguro.
        </p>

        <Separator className="my-8" />

        <h2>Si vas a vender</h2>
        <div className="step-grid">
          {sellerSteps.map(({ icon: Icon, title, text }) => (
            <Card key={title}>
              <CardHeader>
                <Icon size={22} className="text-primary" />
                <CardTitle className="mt-2 text-base">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{text}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator className="my-8" />

        <h2>Si vas a comprar</h2>
        <div className="step-grid">
          {buyerSteps.map(({ icon: Icon, title, text }) => (
            <Card key={title}>
              <CardHeader>
                <Icon size={22} className="text-primary" />
                <CardTitle className="mt-2 text-base">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{text}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator className="my-8" />

        <h2>Lo que nos hace diferentes</h2>
        <ul className="bullet-list">
          <li>
            <strong>Solo dueños reales publican.</strong> No se permite a
            gestores ni revendedores anunciar equipos ajenos — cada vendedor
            confirma que el iPhone es suyo.
          </li>
          <li>
            <strong>Identidad verificada, no datos públicos.</strong>{" "}
            Confirmamos quién eres por dentro, pero tu teléfono y dirección
            exacta nunca se muestran a otros usuarios sin tu permiso.
          </li>
          <li>
            <strong>Moderación antes de publicar.</strong> Ningún anuncio
            llega al catálogo sin que un administrador lo revise primero.
          </li>
          <li>
            <strong>Reputación real.</strong> Las calificaciones solo se
            generan a partir de ventas confirmadas por ambas partes, no se
            pueden fabricar.
          </li>
        </ul>

        <div className="cta-banner">
          <h3>¿Listo para empezar?</h3>
          <div className="cta-banner-actions">
            <Link href="/registro" className="ui-button ui-button-default">
              Crear mi cuenta
            </Link>
            <Link href="/seguridad" className="ui-button ui-button-outline">
              Ver consejos de seguridad
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
