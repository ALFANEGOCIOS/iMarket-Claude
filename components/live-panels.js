"use client";
import { useEffect, useState } from "react";
import {
  ShieldCheck,
  MessageCircle,
  RefreshCw,
  Check,
  Flag,
  UserRound,
  Ban,
  X,
} from "lucide-react";
import { compressPhoto } from "../lib/images";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { ScrollArea } from "./ui/scroll-area";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./ui/select";
import { publicError } from "../lib/database.mjs";
import { municipalities } from "../lib/catalog.mjs";

export function VerificationForm({ repository, user, onComplete }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [agree, setAgree] = useState(false);
  async function submit(event) {
    event.preventDefault();
    if (!agree) {
      setError("Debes autorizar el uso de tus imágenes para continuar.");
      return;
    }
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const [selfie, document] = await Promise.all([
        compressPhoto(data.get("selfie")),
        compressPhoto(data.get("document")),
      ]);
      await repository.verification(user.id, selfie, document);
      onComplete();
    } catch (failure) {
      setError(publicError(failure));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="auth-form" onSubmit={submit}>
      <div className="intro-icon">
        <ShieldCheck size={30} />
      </div>
      <h3>Verifica tu identidad</h3>
      <p>
        Necesitamos una selfie y una foto legible de tu carnet para comprobar
        que eres una persona real. Solo tú y los revisores autorizados podrán
        acceder a las imágenes.
      </p>
      <label className="stack-label">
        Selfie
        <Input
          type="file"
          name="selfie"
          accept="image/jpeg,image/png,image/webp"
          required
          disabled={busy}
        />
      </label>
      <label className="stack-label">
        Foto de tu carnet
        <Input
          type="file"
          name="document"
          accept="image/jpeg,image/png,image/webp"
          required
          disabled={busy}
        />
      </label>
      <label className="checkbox-row terms-check">
        <Checkbox checked={agree} onCheckedChange={(v) => setAgree(Boolean(v))} />
        Autorizo el uso de estas imágenes para revisar mi identidad y confirmo
        que los documentos me pertenecen.
      </label>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <Button variant="default" className="w-full" disabled={busy}>
        {busy ? "Enviando solicitud…" : "Enviar para revisión"}
      </Button>
    </form>
  );
}

export function AccountSettings({ repository, user, onComplete }) {
  const [privateData, setPrivateData] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [municipality, setMunicipality] = useState(
      user.municipality || municipalities[0],
    );
  useEffect(() => {
    let active = true;
    repository
      .privateProfile(user.id)
      .then((data) => {
        if (active) setPrivateData(data || {});
      })
      .catch((failure) => {
        if (active) setError(publicError(failure));
      });
    return () => {
      active = false;
    };
  }, [repository, user.id]);
  async function submit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      await repository.saveProfile(
        user.id,
        data.get("name").trim(),
        municipality,
        data.get("phone").trim(),
        data.get("address").trim(),
      );
      onComplete();
    } catch (failure) {
      setError(publicError(failure));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="auth-form" onSubmit={submit}>
      <div className="intro-icon">
        <UserRound size={30} />
      </div>
      <p>
        Tu nombre y municipio aparecen en tu perfil. El teléfono y la dirección
        exacta son privados.
      </p>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      {privateData && (
        <>
          <label className="stack-label">
            Nombre público
            <Input
              name="name"
              required
              minLength={2}
              maxLength={60}
              defaultValue={user.name}
            />
          </label>
          <label className="stack-label">
            Municipio
            <Select value={municipality} onValueChange={setMunicipality}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {municipalities.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <label className="stack-label">
            Teléfono privado
            <Input
              type="tel"
              name="phone"
              maxLength={30}
              defaultValue={privateData.phone || ""}
            />
          </label>
          <label className="stack-label">
            Dirección exacta (privada)
            <Textarea
              name="address"
              maxLength={300}
              defaultValue={privateData.exact_address || ""}
            />
          </label>
          <Button variant="default" className="w-full" disabled={busy}>
            {busy ? "Guardando…" : "Guardar mis datos"}
          </Button>
        </>
      )}
    </form>
  );
}

export function Inbox({ repository, user, notify }) {
  const [conversations, setConversations] = useState([]),
    [selected, setSelected] = useState(null),
    [messages, setMessages] = useState([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    repository
      .conversations()
      .then((items) => {
        if (active) setConversations(items);
      })
      .catch((failure) => {
        if (active) setError(publicError(failure));
      });
    return () => {
      active = false;
    };
  }, [repository]);
  useEffect(() => {
    if (!selected) return;
    let active = true;
    repository
      .messages(selected.id)
      .then(async (items) => {
        if (active) {
          setMessages(items);
          await repository.read(selected.id);
        }
      })
      .catch((failure) => {
        if (active) setError(publicError(failure));
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [selected, repository]);
  async function refresh() {
    setBusy(true);
    setError("");
    try {
      setConversations(await repository.conversations());
      if (selected) {
        setMessages(await repository.messages(selected.id));
        await repository.read(selected.id);
      }
    } catch (failure) {
      setError(publicError(failure));
    } finally {
      setBusy(false);
    }
  }
  async function send(event) {
    event.preventDefault();
    const form = event.currentTarget,
      body = new FormData(form).get("content").trim();
    setBusy(true);
    setError("");
    try {
      await repository.reply(selected.id, body);
      form.reset();
      setMessages(await repository.messages(selected.id));
    } catch (failure) {
      setError(publicError(failure));
    } finally {
      setBusy(false);
    }
  }
  async function block() {
    const other =
      selected.buyer_id === user.id ? selected.seller_id : selected.buyer_id;
    try {
      await repository.block(user.id, other);
      notify("Usuario bloqueado. Ya no podrán enviarse mensajes.");
    } catch (failure) {
      setError(publicError(failure));
    }
  }
  return (
    <div className="profile-body">
      <div className="profile-section-heading">
        <h3>
          <MessageCircle size={18} /> Mis mensajes
        </h3>
        <Button variant="link" onClick={refresh} disabled={busy}>
          <RefreshCw size={14} />
          Actualizar
        </Button>
      </div>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <div className="conversation-list">
        {conversations.map((conversation) => (
          <button
            key={conversation.id}
            className={selected?.id === conversation.id ? "selected" : ""}
            onClick={() => {
              setBusy(true);
              setMessages([]);
              setSelected(conversation);
              setError("");
            }}
          >
            <strong>{conversation.listing?.model || "Conversación"}</strong>
            <span>
              {conversation.buyer_id === user.id
                ? conversation.seller?.display_name
                : conversation.buyer?.display_name}
            </span>
          </button>
        ))}
      </div>
      {!conversations.length && (
        <p className="muted">
          Todavía no tienes conversaciones. Empieza desde un anuncio.
        </p>
      )}
      {selected && (
        <>
          <ScrollArea className="message-thread" viewportClassName="message-thread-inner">
            {messages.map((message) => (
              <div
                key={message.id}
                className={
                  message.sender_id === user.id ? "message mine" : "message"
                }
              >
                <p>{message.content}</p>
                <small>
                  {new Date(message.created_at).toLocaleString("es")}{" "}
                  {message.sender_id === user.id && message.read_at
                    ? "· Leído"
                    : ""}
                </small>
              </div>
            ))}
          </ScrollArea>
          <form onSubmit={send}>
            <label className="stack-label">
              Tu respuesta
              <Textarea
                name="content"
                required
                minLength={1}
                maxLength={2000}
                rows={2}
              />
            </label>
            <Button variant="default" disabled={busy}>
              Enviar mensaje
            </Button>
          </form>
          <Button variant="link" onClick={block}>
            Bloquear a este usuario
          </Button>
        </>
      )}
    </div>
  );
}

const REPORT_REASONS = [
  "Información engañosa",
  "Posible fraude",
  "No es el propietario",
  "Otro motivo",
];

export function ReportForm({ repository, user, listing, onComplete }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [reason, setReason] = useState(REPORT_REASONS[0]);
  async function submit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await repository.report(
        user.id,
        listing.id,
        listing.sellerId,
        reason,
        data.get("description"),
      );
      onComplete();
    } catch (failure) {
      setError(publicError(failure));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="auth-form" onSubmit={submit}>
      <div className="intro-icon">
        <Flag size={30} />
      </div>
      <p>
        Cuéntanos qué sucede con este anuncio. El equipo de moderación revisará
        tu reporte.
      </p>
      <label className="stack-label">
        Motivo
        <Select value={reason} onValueChange={setReason}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REPORT_REASONS.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      <label className="stack-label">
        Detalles
        <Textarea name="description" maxLength={1500} required minLength={10} />
      </label>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <Button variant="default" className="w-full" disabled={busy}>
        Enviar reporte
      </Button>
    </form>
  );
}

function RevenueChart({ sales }) {
  const confirmed = (sales || []).filter((s) => s.status === "confirmed");
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString("es", { month: "short" }),
      total: 0,
      count: 0,
    });
  }
  confirmed.forEach((sale) => {
    const d = new Date(sale.confirmed_at || sale.created_at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const bucket = months.find((m) => m.key === key);
    if (bucket) {
      bucket.total += Number(sale.sold_price_usd) || 0;
      bucket.count += 1;
    }
  });
  const max = Math.max(1, ...months.map((m) => m.total));
  const grandTotal = confirmed.reduce(
    (sum, s) => sum + (Number(s.sold_price_usd) || 0),
    0,
  );
  const width = 560,
    height = 200,
    padding = 28,
    barWidth = (width - padding * 2) / months.length / 1.7;
  return (
    <div className="revenue-chart">
      <div className="revenue-chart-head">
        <h4 className="profile-subheading">Ingresos generados (últimos 6 meses)</h4>
        <strong>${grandTotal.toLocaleString("es")} USD</strong>
      </div>
      {confirmed.length === 0 ? (
        <p className="muted">
          Aún no hay ventas confirmadas para graficar.
        </p>
      ) : (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="revenue-chart-svg"
          role="img"
          aria-label="Gráfico de ingresos mensuales"
        >
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="var(--border)"
          />
          {months.map((m, i) => {
            const slot = (width - padding * 2) / months.length;
            const x = padding + slot * i + (slot - barWidth) / 2;
            const barHeight = (m.total / max) * (height - padding * 2 - 20);
            const y = height - padding - barHeight;
            return (
              <g key={m.key}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={4}
                  fill="var(--primary)"
                >
                  <title>
                    {m.label}: ${m.total.toLocaleString("es")} USD ·{" "}
                    {m.count} venta(s)
                  </title>
                </rect>
                {m.total > 0 && (
                  <text
                    x={x + barWidth / 2}
                    y={y - 6}
                    textAnchor="middle"
                    fontSize="10"
                    fill="var(--muted-foreground)"
                  >
                    ${m.total}
                  </text>
                )}
                <text
                  x={x + barWidth / 2}
                  y={height - padding + 14}
                  textAnchor="middle"
                  fontSize="10"
                  fill="var(--muted-foreground)"
                  style={{ textTransform: "capitalize" }}
                >
                  {m.label}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}

const ADMIN_TABS = [
  { id: "resumen", label: "Resumen" },
  { id: "identidades", label: "Identidades" },
  { id: "anuncios", label: "Anuncios" },
  { id: "destacados", label: "Destacados" },
  { id: "usuarios", label: "Usuarios" },
  { id: "reportes", label: "Reportes" },
  { id: "ventas", label: "Ventas" },
];

export function AdminPanel({ repository, notify }) {
  const [tab, setTab] = useState("resumen");
  const [metrics, setMetrics] = useState(null);
  const [verifications, setVerifications] = useState([]),
    [listings, setListings] = useState([]),
    [users, setUsers] = useState([]),
    [reports, setReports] = useState([]),
    [sales, setSales] = useState([]),
    [published, setPublished] = useState([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [images, setImages] = useState({});

  async function reload() {
    const [
      metricsResult,
      requests,
      pending,
      allUsers,
      allReports,
      allSales,
      allPublished,
    ] = await Promise.all([
      repository.adminMetrics(),
      repository.verificationQueue(),
      repository.listingQueue(),
      repository.adminUsers(),
      repository.adminReports(),
      repository.adminSales(),
      repository.adminListings(),
    ]);
    setMetrics(metricsResult);
    setVerifications(requests);
    setListings(pending);
    setUsers(allUsers);
    setReports(allReports);
    setSales(allSales);
    setPublished(allPublished);
    setImages({});
  }
  async function toggleFeatured(listingId, featured) {
    setBusy(true);
    setError("");
    try {
      await repository.adminSetFeatured(listingId, featured);
      await reload();
      notify(featured ? "Anuncio destacado." : "Anuncio ya no está destacado.");
    } catch (failure) {
      setError(publicError(failure));
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    let active = true;
    reload().catch((failure) => {
      if (active) setError(publicError(failure));
    });
    return () => {
      active = false;
    };
  }, [repository]);

  async function view(request) {
    setError("");
    try {
      const [selfie, document] = await Promise.all([
        repository.signedIdentity(request.selfie_path),
        repository.signedIdentity(request.document_path),
      ]);
      setImages({ id: request.id, selfie, document });
    } catch (failure) {
      setError(publicError(failure));
    }
  }
  async function decide(kind, id, approve, reason) {
    setBusy(true);
    setError("");
    try {
      if (kind === "identity")
        await repository.reviewVerification(id, approve, reason);
      else await repository.reviewListing(id, approve, reason);
      await reload();
      notify(approve ? "Solicitud aprobada." : "Solicitud rechazada.");
    } catch (failure) {
      setError(publicError(failure));
    } finally {
      setBusy(false);
    }
  }
  async function setStatus(userId, patch) {
    setBusy(true);
    setError("");
    try {
      await repository.adminSetAccountStatus(
        userId,
        patch.is_suspended,
        patch.is_banned,
      );
      await reload();
      notify("Cuenta actualizada.");
    } catch (failure) {
      setError(publicError(failure));
    } finally {
      setBusy(false);
    }
  }
  async function toggleRole(userId, role, grant) {
    setBusy(true);
    setError("");
    try {
      await repository.adminSetRole(userId, role, grant);
      await reload();
      notify(grant ? "Rol otorgado." : "Rol revocado.");
    } catch (failure) {
      setError(publicError(failure));
    } finally {
      setBusy(false);
    }
  }
  async function resolveReport(reportId, approve) {
    const notes = window.prompt(
      approve
        ? "Notas de resolución (opcional):"
        : "Motivo para descartar el reporte:",
    );
    if (notes === null) return;
    setBusy(true);
    setError("");
    try {
      await repository.adminResolveReport(reportId, approve, notes);
      await reload();
      notify(approve ? "Reporte resuelto." : "Reporte descartado.");
    } catch (failure) {
      setError(publicError(failure));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="profile-body">
      <h3>Panel de administración</h3>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {ADMIN_TABS.map((item) => (
            <TabsTrigger key={item.id} value={item.id}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

      <TabsContent value="resumen">
      {metrics && (
        <div className="admin-metrics">
          <div className="admin-metric">
            <strong>{metrics.totalUsers}</strong>
            <span>Usuarios</span>
          </div>
          <div className="admin-metric">
            <strong>{metrics.pendingVerifications}</strong>
            <span>Identidades pendientes</span>
          </div>
          <div className="admin-metric">
            <strong>{metrics.pendingListings}</strong>
            <span>Anuncios por revisar</span>
          </div>
          <div className="admin-metric">
            <strong>{metrics.publishedListings}</strong>
            <span>Anuncios publicados</span>
          </div>
          <div className="admin-metric">
            <strong>{metrics.openReports}</strong>
            <span>Reportes abiertos</span>
          </div>
          <div className="admin-metric">
            <strong>{metrics.totalSales}</strong>
            <span>Ventas confirmadas</span>
          </div>
          <div className="admin-metric">
            <strong>{metrics.reportedSales}</strong>
            <span>Ventas sin confirmar</span>
          </div>
          <div className="admin-metric">
            <strong>
              {metrics.suspendedUsers}/{metrics.bannedUsers}
            </strong>
            <span>Suspendidos / baneados</span>
          </div>
        </div>
      )}

      <RevenueChart sales={sales} />
      </TabsContent>

      <TabsContent value="identidades">
          <h4 className="profile-subheading">
            Identidades pendientes ({verifications.length})
          </h4>
          {!verifications.length && (
            <p className="muted">No hay solicitudes pendientes.</p>
          )}
          {verifications.map((request) => (
            <section className="admin-request" key={request.id}>
              <strong>{request.profile?.display_name}</strong>
              <Button variant="link" onClick={() => view(request)}>
                Ver imágenes privadas
              </Button>
              {images.id === request.id && (
                <div className="verification-images">
                  <img src={images.selfie} alt="Selfie para revisión" />
                  <img src={images.document} alt="Documento para revisión" />
                  <small>
                    Acceso temporal de 60 segundos. Vuelve a abrir las
                    imágenes si caduca.
                  </small>
                </div>
              )}
              <DecisionForm
                busy={busy}
                onDecision={(approve, reason) =>
                  decide("identity", request.id, approve, reason)
                }
              />
            </section>
          ))}
      </TabsContent>

      <TabsContent value="anuncios">
          <h4 className="profile-subheading">
            Anuncios por revisar ({listings.length})
          </h4>
          {!listings.length && (
            <p className="muted">No hay anuncios pendientes.</p>
          )}
          {listings.map((listing) => (
            <section className="admin-request" key={listing.id}>
              <strong>
                {listing.model} · {listing.seller}
              </strong>
              <p className="muted">{listing.description}</p>
              <div className="verification-images">
                {listing.photos.map((photo) => (
                  <img src={photo} alt="Foto del anuncio" key={photo} />
                ))}
              </div>
              <p className="muted">
                ${listing.price} USD · {listing.storage} GB · Batería{" "}
                {listing.battery ?? "sin informar"} · {listing.condition}
              </p>
              <DecisionForm
                busy={busy}
                onDecision={(approve, reason) =>
                  decide("listing", listing.id, approve, reason)
                }
              />
            </section>
          ))}
      </TabsContent>

      <TabsContent value="destacados">
          <h4 className="profile-subheading">
            Anuncios publicados ({published.length})
          </h4>
          <p className="muted">
            Los destacados aparecen en una franja especial al inicio del
            marketplace.
          </p>
          {published.map((listing) => (
            <div className="admin-row" key={listing.id}>
              <div>
                <strong>
                  {listing.model} · {listing.storage_gb} GB
                </strong>
                <small>
                  {listing.seller?.display_name || "—"} · ${listing.price_usd}{" "}
                  USD
                </small>
              </div>
              <button
                type="button"
                className={listing.featured_at ? "small-button" : "ghost-button"}
                disabled={busy}
                onClick={() =>
                  toggleFeatured(listing.id, !listing.featured_at)
                }
              >
                {listing.featured_at ? "Quitar de destacados" : "Destacar"}
              </button>
            </div>
          ))}
      </TabsContent>

      <TabsContent value="usuarios">
          <h4 className="profile-subheading">Usuarios ({users.length})</h4>
          {users.map((person) => (
            <div className="admin-row" key={person.id}>
              <div>
                <strong>{person.display_name}</strong>
                <small>
                  {person.municipality || "Sin municipio"} ·{" "}
                  {person.verification_status} ·{" "}
                  {person.is_banned
                    ? "Baneado"
                    : person.is_suspended
                      ? "Suspendido"
                      : "Activo"}
                </small>
              </div>
              <Button
                type="button"
                variant="ghost" size="sm"
                disabled={busy}
                onClick={() =>
                  setStatus(person.id, {
                    is_suspended: !person.is_suspended,
                    is_banned: person.is_banned,
                  })
                }
              >
                {person.is_suspended ? "Reactivar" : "Suspender"}
              </Button>
              <Button
                type="button"
                variant="destructive" size="sm"
                disabled={busy}
                onClick={() =>
                  setStatus(person.id, {
                    is_suspended: person.is_suspended,
                    is_banned: !person.is_banned,
                  })
                }
              >
                <Ban size={12} /> {person.is_banned ? "Desbanear" : "Banear"}
              </Button>
              <Button
                type="button"
                variant="ghost" size="sm"
                disabled={busy}
                onClick={() => toggleRole(person.id, "moderator", true)}
              >
                + Moderador
              </Button>
            </div>
          ))}
      </TabsContent>

      <TabsContent value="reportes">
          <h4 className="profile-subheading">Reportes ({reports.length})</h4>
          {!reports.length && (
            <p className="muted">No hay reportes registrados.</p>
          )}
          {reports.map((report) => (
            <div className="admin-row" key={report.id}>
              <div>
                <strong>
                  {report.reason}{" "}
                  {report.listing?.model ? `· ${report.listing.model}` : ""}
                </strong>
                <small>
                  De {report.reporter?.display_name || "—"}
                  {report.reported?.display_name
                    ? ` sobre ${report.reported.display_name}`
                    : ""}{" "}
                  · {report.status}
                </small>
                {report.description && (
                  <p className="muted">{report.description}</p>
                )}
              </div>
              {report.status === "pending" && (
                <>
                  <Button
                    type="button"
                    variant="ghost" size="sm"
                    disabled={busy}
                    onClick={() => resolveReport(report.id, true)}
                  >
                    <Check size={12} /> Resolver
                  </Button>
                  <Button
                    type="button"
                    variant="destructive" size="sm"
                    disabled={busy}
                    onClick={() => resolveReport(report.id, false)}
                  >
                    <X size={12} /> Descartar
                  </Button>
                </>
              )}
            </div>
          ))}
      </TabsContent>

      <TabsContent value="ventas">
          <h4 className="profile-subheading">Ventas ({sales.length})</h4>
          {!sales.length && <p className="muted">Sin ventas registradas.</p>}
          {sales.map((sale) => (
            <div className="admin-row" key={sale.id}>
              <div>
                <strong>{sale.listing?.model || "iPhone"}</strong>
                <small>
                  Vendedor {sale.seller?.display_name || "—"} · Comprador{" "}
                  {sale.buyer?.display_name || "sin vincular"} · $
                  {sale.sold_price_usd} USD
                </small>
              </div>
              <Badge variant={sale.status === "confirmed" ? "secondary" : "outline"}>
                {sale.status === "confirmed" ? (
                  <>
                    <Check size={14} /> Confirmada
                  </>
                ) : (
                  "Reportada"
                )}
              </Badge>
            </div>
          ))}
      </TabsContent>
      </Tabs>
    </div>
  );
}
function DecisionForm({ busy, onDecision }) {
  return (
    <form
      className="decision-form"
      onSubmit={(event) => {
        event.preventDefault();
        const reason = new FormData(event.currentTarget).get("reason").trim();
        if (reason.length >= 5) onDecision(false, reason);
      }}
    >
      <Button
        variant="outline" size="sm"
        type="button"
        disabled={busy}
        onClick={() => onDecision(true, null)}
      >
        <Check size={13} />
        Aprobar
      </Button>
      <label>
        Motivo de rechazo
        <input
          name="reason"
          required
          minLength={5}
          maxLength={500}
          placeholder="Explica qué debe corregir"
        />
      </label>
      <Button variant="outline" size="sm" disabled={busy}>
        Rechazar
      </Button>
    </form>
  );
}
