import Link from "next/link";
import { ArrowLeft, ShieldCheck, MapPin, Lock, Flag, Eye, UserCheck,
} from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";
import {
  Card, CardHeader, CardTitle, CardContent, CardDescription,
} from "../../components/ui/card";
import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
} from "../../components/ui/accordion";

export const metadata = {
  title: "Seguridad | iMarket",
  description: "Cómo protegemos tu cuenta y tus datos, y consejos para comprar y vender iPhones de forma segura.",
};

const tips = [
  {
    icon: MapPin,
    title: "Encuéntrense en un lugar público",
    text: "Mejor de día, en una zona con movimiento. Evita entregar o recibir el equipo en lugares aislados.",
  },
  {
    icon: Eye,
    title: "Revisa el equipo antes de pagar",
    text: "Enciéndelo, comprueba que no tenga bloqueo de iCloud/Buscar mi iPhone, que la pantalla, batería y cámaras funcionen, y que el IMEI coincida con el anuncio.",
  },
  {
    icon: UserCheck,
    title: "Prioriza vendedores verificados",
    text: "La insignia de verificado significa que esa persona confirmó su identidad con iMarket — úsalo como un primer filtro, no como garantía absoluta.",
  },
  {
    icon: Lock,
    title: "No compartas más de lo necesario",
    text: "Tu teléfono y dirección exacta son privados por defecto. Compártelos solo cuando ya decidiste seguir adelante con alguien específico.",
  },
];

const faqs = [
  {
    q: "¿iMarket cobra alguna comisión por la venta?",
    a: "No. iMarket no participa en el pago ni cobra comisión. El precio y la forma de pago se acuerdan directamente entre comprador y vendedor.",
  },
  {
    q: "¿Quién ve mi número de teléfono?",
    a: "Nadie, hasta que tú lo decidas. Tu teléfono y tu dirección exacta son privados; solo tu municipio aparece en el anuncio.",
  },
  {
    q: "¿Qué pasa con las fotos de mi identificación?",
    a: "Se usan únicamente para que el equipo de moderación confirme que eres una persona real antes de dejarte publicar. No se muestran a otros usuarios ni aparecen en tu perfil público.",
  },
  {
    q: "¿Qué hago si un vendedor o comprador me parece sospechoso?",
    a: "Puedes reportar el anuncio o el perfil desde la propia publicación. El equipo de iMarket revisa cada reporte y puede suspender la cuenta si corresponde.",
  },
  {
    q: "¿iMarket garantiza el estado del iPhone?",
    a: "No. Revisamos que el anuncio sea coherente antes de publicarlo, pero la verificación física del equipo (batería, bloqueo de iCloud, funcionamiento) es responsabilidad del comprador al momento de encontrarse en persona.",
  },
  {
    q: "¿Qué significa la insignia de \"verificado\"?",
    a: "Que esa persona confirmó su identidad con un documento y una selfie ante el equipo de iMarket. No es una garantía sobre la transacción, pero reduce el riesgo de perfiles falsos.",
  },
  {
    q: "¿Puedo eliminar mi cuenta y mis datos?",
    a: "Sí, puedes pedirlo desde la sección de ayuda dentro de tu cuenta. Tus anuncios, mensajes y datos privados se eliminan de acuerdo a nuestros Términos y condiciones.",
  },
];

export default function SeguridadPage() {
  return (
    <div className="static-page">
      <header className="static-header">
        <Link href="/" className="auth-brand">
          <img src="/brand/logo-icon.png" alt="" width="30" height="30" className="auth-brand-logo" />
          iMarket
        </Link>
        <Link href="/" className="back-link"><ArrowLeft size={15} /> Volver al inicio</Link>
      </header>

      <main className="static-content">
        <Badge variant="outline">Seguridad</Badge>
        <h1>Comprar y vender con confianza</h1>
        <p className="lead">
          iMarket reduce el riesgo antes de que te encuentres con alguien,
          pero el cuidado final durante el intercambio es de ambas partes.
          Aquí te explicamos cómo nos protegemos juntos.
        </p>

        <Separator className="my-8" />

        <h2>Consejos para el encuentro</h2>
        <div className="step-grid">
          {tips.map(({ icon: Icon, title, text }) => (
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

        <h2>Lo que hacemos por dentro</h2>
        <ul className="bullet-list">
          <li>
            <ShieldCheck size={16} className="inline-icon" /> Verificamos la
            identidad de cada vendedor (selfie + documento) antes de dejarlo
            publicar.
          </li>
          <li>
            <Eye size={16} className="inline-icon" /> Un administrador
            revisa cada anuncio antes de que sea visible en el catálogo.
          </li>
          <li>
            <Lock size={16} className="inline-icon" /> Tu teléfono y
            dirección exacta nunca se muestran públicamente.
          </li>
          <li>
            <Flag size={16} className="inline-icon" /> Cualquier anuncio o
            perfil se puede reportar, y los reportes se revisan por el
            equipo de moderación.
          </li>
        </ul>

        <Separator className="my-8" />

        <h2>Preguntas frecuentes</h2>
        <Accordion type="single" collapsible className="faq-accordion">
          {faqs.map(({ q, a }) => (
            <AccordionItem key={q} value={q}>
              <AccordionTrigger>{q}</AccordionTrigger>
              <AccordionContent>{a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="cta-banner">
          <h3>¿Quieres saber cómo funciona todo el proceso?</h3>
          <div className="cta-banner-actions">
            <Link href="/como-funciona" className="ui-button ui-button-default">
              Ver cómo funciona
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
