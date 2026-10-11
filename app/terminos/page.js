import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";

export const metadata = {
  title: "Términos y condiciones | iMarket",
  description: "Condiciones de uso de iMarket, marketplace de iPhones en La Habana.",
};

export default function TerminosPage() {
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
        <Badge variant="outline">Términos y condiciones</Badge>
        <h1>Condiciones de uso de iMarket</h1>
        <p className="lead">
          Última actualización: {new Date().toLocaleDateString("es", { year: "numeric", month: "long" })}.
          Al crear una cuenta o usar iMarket aceptas estas condiciones.
        </p>

        <Separator className="my-8" />

        <h2>1. Qué es iMarket</h2>
        <p>
          iMarket es un espacio digital que conecta a personas que quieren
          vender su iPhone con personas que quieren comprar uno, en La
          Habana. iMarket <strong>no es una tienda, no es parte de la
          compraventa, no cobra comisión y no procesa pagos</strong>. El
          precio, la forma de pago, el lugar y la entrega los acuerdan
          directamente el comprador y el vendedor, fuera de la plataforma.
        </p>

        <h2>2. Quién puede publicar</h2>
        <ul className="bullet-list">
          <li>Solo personas mayores de edad, dueñas reales del equipo que publican.</li>
          <li>
            No está permitido publicar en nombre de terceros, actuar como
            gestor o intermediario de ventas, ni anunciar varios equipos que
            no te pertenecen.
          </li>
          <li>No se permite publicar dispositivos de procedencia ilícita o robados.</li>
          <li>
            Para publicar es obligatorio verificar tu identidad (selfie +
            documento de identidad). Ese material se usa únicamente para la
            verificación y no se muestra a otros usuarios.
          </li>
        </ul>

        <h2>3. Revisión de anuncios</h2>
        <p>
          Todo anuncio pasa por una revisión antes de publicarse. iMarket
          puede rechazar, editar la visibilidad o retirar cualquier anuncio
          que incumpla estas condiciones, contenga información falsa o
          engañosa, o sea reportado por otros usuarios con motivo
          justificado.
        </p>

        <h2>4. La compraventa es entre ustedes</h2>
        <p>
          iMarket facilita el contacto y la confianza inicial (identidad
          verificada, reputación, mensajería), pero <strong>no participa,
          no garantiza ni se responsabiliza por la transacción en sí</strong>:
          el estado real del equipo, el precio acordado, la entrega del
          dinero o del dispositivo son responsabilidad exclusiva de comprador
          y vendedor. Recomendamos encontrarse en un lugar público y revisar
          el equipo antes de pagar — ver nuestra página de{" "}
          <Link href="/seguridad">Seguridad</Link>.
        </p>

        <h2>5. Cuentas, suspensión y reportes</h2>
        <ul className="bullet-list">
          <li>Eres responsable de la actividad de tu cuenta y de la veracidad de lo que publicas.</li>
          <li>
            Cualquier usuario puede reportar un anuncio o un perfil. El
            equipo de iMarket revisa cada reporte y puede suspender o
            inhabilitar cuentas que incumplan estas condiciones.
          </li>
          <li>
            Nos reservamos el derecho de retirar contenido o cerrar cuentas
            vinculadas a fraude, suplantación, acoso o publicaciones falsas,
            sin necesidad de aviso previo.
          </li>
        </ul>

        <h2>6. Privacidad de tus datos</h2>
        <p>
          Tu nombre, municipio y reputación son visibles para otros usuarios.
          Tu teléfono y dirección exacta son privados — solo tú decides
          compartirlos al conversar con un comprador o vendedor. Tus
          documentos de verificación de identidad solo son accesibles para
          el equipo de moderación de iMarket.
        </p>

        <h2>7. Cambios en estas condiciones</h2>
        <p>
          Podemos actualizar estas condiciones según evolucione la
          plataforma. Si el cambio es significativo, lo avisaremos dentro de
          la aplicación.
        </p>

        <h2>8. Contacto</h2>
        <p>
          ¿Dudas sobre estas condiciones o quieres reportar algo? Escríbenos
          desde la sección de ayuda dentro de tu cuenta.
        </p>
      </main>
    </div>
  );
}
