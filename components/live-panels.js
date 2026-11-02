"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { cosmeticLabel } from "../lib/catalog.mjs";
import { storageLabel } from "../lib/iphone-storage.mjs";
import {
  LayoutGrid,
  Smartphone,
  Star,
  Users,
  DollarSign,
  LogOut,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  ShieldCheck,
  MessageCircle,
  RefreshCw,
  Check,
  Flag,
  UserRound,
  Ban,
  X,
  Clock,
  Trash2,
} from "lucide-react";
import { compressPhoto } from "../lib/images";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";
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
    ),
    [emailPref, setEmailPref] = useState(null);
  useEffect(() => {
    let active = true;
    // Si la función aún no existe en Supabase, la casilla simplemente no se muestra.
    repository
      .emailPref()
      .then((value) => {
        if (active) setEmailPref(value);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [repository]);
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
      if (emailPref !== null) await repository.setEmailPref(emailPref);
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
          {emailPref !== null && (
            <label className="checkbox-row">
              <Checkbox
                checked={emailPref}
                onCheckedChange={(v) => setEmailPref(Boolean(v))}
              />
              Recibir avisos por correo (mensajes y estado de mis anuncios)
            </label>
          )}
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

const ADMIN_TABS = [
  { id: "resumen", label: "Resumen", icon: LayoutGrid },
  { id: "identidades", label: "Identidades", icon: ShieldCheck },
  { id: "anuncios", label: "Anuncios", icon: Smartphone },
  { id: "pendientes", label: "Pendientes", icon: Clock },
  { id: "usuarios", label: "Usuarios", icon: Users },
  { id: "reportes", label: "Reportes", icon: Flag },
  { id: "ventas", label: "Ventas", icon: DollarSign },
];

const money = (n) => `$${Math.round(Number(n) || 0).toLocaleString("es")}`;
const saleDate = (sale) => new Date(sale.confirmed_at || sale.created_at);

function Delta({ current, previous }) {
  if (!previous && !current) return <span className="delta delta-flat">Sin datos del mes anterior</span>;
  if (!previous) return <span className="delta delta-up"><ArrowUp size={12} /> Nuevo este mes</span>;
  const pct = ((current - previous) / previous) * 100;
  const up = pct >= 0;
  return (
    <span className={`delta ${up ? "delta-up" : "delta-down"}`}>
      {up ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
      {Math.abs(pct).toLocaleString("es", { maximumFractionDigits: 1 })} %
      <em>vs. mes anterior</em>
    </span>
  );
}

function SalesChart({ sales }) {
  const [range, setRange] = useState(30);
  const confirmed = (sales || []).filter((x) => x.status === "confirmed");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = [];
  for (let i = range - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push({ date: d, total: 0 });
  }
  const start = days[0].date.getTime();
  confirmed.forEach((sale) => {
    const d = saleDate(sale);
    d.setHours(0, 0, 0, 0);
    const idx = Math.round((d.getTime() - start) / 86400000);
    if (idx >= 0 && idx < days.length) days[idx].total += Number(sale.sold_price_usd) || 0;
  });
  const max = Math.max(1, ...days.map((d) => d.total));
  const peak = days.reduce((best, d) => (d.total > best.total ? d : best), days[0]);
  const W = 640, H = 220, PX = 8, PY = 18;
  const x = (i) => PX + (i / Math.max(1, days.length - 1)) * (W - PX * 2);
  const y = (v) => H - PY - (v / max) * (H - PY * 2);
  const line = days.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.total).toFixed(1)}`).join(" ");
  const area = `${line} L${x(days.length - 1)},${H - PY} L${x(0)},${H - PY} Z`;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => days[Math.round(f * (days.length - 1))]);
  const peakIndex = days.indexOf(peak);
  return (
    <div className="admin-card admin-chart-card">
      <div className="admin-card-head">
        <div>
          <h3>Ventas de los últimos {range} días</h3>
          <p>
            {peak.total > 0
              ? `Pico de ${money(peak.total)} el ${peak.date.toLocaleDateString("es", { day: "numeric", month: "long" })}`
              : "Aún no hay ventas confirmadas en este periodo"}
          </p>
        </div>
        <div className="range-toggle" role="group" aria-label="Periodo">
          {[7, 30, 90].map((r) => (
            <button key={r} type="button" aria-pressed={range === r} className={range === r ? "active" : ""} onClick={() => setRange(r)}>
              {r} d
            </button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="sales-chart-svg" role="img" aria-label="Gráfico de ventas">
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={PX} x2={W - PX} y1={H - PY - f * (H - PY * 2)} y2={H - PY - f * (H - PY * 2)} stroke="var(--border)" />
        ))}
        <path d={area} fill="var(--accent)" opacity="0.9" />
        <path d={line} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {peak.total > 0 && <circle cx={x(peakIndex)} cy={y(peak.total)} r="5" fill="var(--primary)" stroke="#fff" strokeWidth="2" />}
      </svg>
      <div className="sales-chart-axis">
        {ticks.map((d, i) => (
          <span key={i}>{d.date.toLocaleDateString("es", { day: "numeric", month: "short" })}</span>
        ))}
      </div>
    </div>
  );
}

function TopModels({ sales }) {
  const counts = {};
  (sales || [])
    .filter((x) => x.status === "confirmed")
    .forEach((x) => {
      const m = x.listing?.model || "iPhone";
      counts[m] = (counts[m] || 0) + 1;
    });
  const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const max = Math.max(1, ...rows.map((r) => r[1]));
  return (
    <div className="admin-card">
      <div className="admin-card-head"><h3>Modelos más vendidos</h3></div>
      {!rows.length && <p className="muted">Aún no hay ventas confirmadas.</p>}
      <div className="top-models">
        {rows.map(([model, count]) => (
          <div key={model}>
            <div className="top-model-row"><span>{model}</span><strong>{count}</strong></div>
            <div className="top-model-bar"><i style={{ width: `${(count / max) * 100}%` }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SaleStatus({ sale }) {
  return sale.status === "confirmed" ? (
    <span className="status-pill status-ok">Confirmada</span>
  ) : (
    <span className="status-pill status-warn">Sin confirmar</span>
  );
}

export function AdminPanel({ repository, notify, user, onLogout }) {
  const [tab, setTab] = useState("resumen");
  const [metrics, setMetrics] = useState(null);
  const [verifications, setVerifications] = useState([]),
    [listings, setListings] = useState([]),
    [users, setUsers] = useState([]),
    [roleRows, setRoleRows] = useState([]),
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
      allRoles,
      allReports,
      allSales,
      allPublished,
    ] = await Promise.all([
      repository.adminMetrics(),
      repository.verificationQueue(),
      repository.listingQueue(),
      repository.adminUsers(),
      repository.adminRoles(),
      repository.adminReports(),
      repository.adminSales(),
      repository.adminListings(),
    ]);
    setMetrics(metricsResult);
    setVerifications(requests);
    setListings(pending);
    setUsers(allUsers);
    setRoleRows(allRoles);
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
  async function removeListing(listing) {
    const reason = window.prompt(
      `¿Eliminar "${listing.model}" de ${listing.seller?.display_name || "el vendedor"}? Escribe el motivo (mín. 5 caracteres):`,
    );
    if (reason === null) return;
    if (reason.trim().length < 5) {
      setError("Escribe un motivo de al menos 5 caracteres.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await repository.adminRemoveListing(listing.id, reason.trim());
      await reload();
      notify("Anuncio eliminado.");
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
    if (
      !grant &&
      !window.confirm("¿Quitar el rol de moderador a este usuario? Perderá el acceso de moderación de inmediato.")
    )
      return;
    setBusy(true);
    setError("");
    try {
      await repository.adminSetRole(userId, role, grant);
      await reload();
      notify(grant ? "Ahora es moderador." : "Rol de moderador quitado.");
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

  const confirmed = sales.filter((x) => x.status === "confirmed");
  const now = new Date();
  const inMonth = (d, offset) => {
    const ref = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
  };
  const sumPrice = (list) => list.reduce((t, x) => t + (Number(x.sold_price_usd) || 0), 0);
  const monthNow = confirmed.filter((x) => inMonth(saleDate(x), 0));
  const monthPrev = confirmed.filter((x) => inMonth(saleDate(x), 1));
  const revenueNow = sumPrice(monthNow);
  const revenuePrev = sumPrice(monthPrev);
  const salesNow = monthNow.length;
  const salesPrev = monthPrev.length;
  const monthLabel = now.toLocaleDateString("es", { month: "long", year: "numeric" });
  const current = ADMIN_TABS.find((item) => item.id === tab) || ADMIN_TABS[0];
  const attention = metrics
    ? [
        { label: "Identidades pendientes", value: metrics.pendingVerifications, tab: "identidades", tone: "warn" },
        { label: "Anuncios por revisar", value: metrics.pendingListings, tab: "pendientes", tone: "info" },
        { label: "Reportes abiertos", value: metrics.openReports, tab: "reportes", tone: "danger" },
        { label: "Ventas sin confirmar", value: metrics.reportedSales, tab: "ventas", tone: "muted" },
      ]
    : [];

  return (
    <Tabs value={tab} onValueChange={setTab} orientation="vertical" className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/" className="admin-sidebar-brand">
          <img src="/brand/logo-icon.png" alt="" width="30" height="30" />
          <span>iMarket</span>
        </Link>
        <TabsList className="admin-nav h-auto w-full flex-col items-stretch justify-start gap-1 rounded-none bg-transparent p-0">
          {ADMIN_TABS.map((item) => {
            const Icon = item.icon;
            const badge =
              item.id === "identidades" ? metrics?.pendingVerifications
              : item.id === "pendientes" ? metrics?.pendingListings
              : item.id === "reportes" ? metrics?.openReports
              : 0;
            return (
              <TabsTrigger
                key={item.id}
                value={item.id}
                className="admin-nav-item h-10 w-full flex-none justify-start gap-3 rounded-lg px-3 text-sm font-semibold text-white/70 shadow-none data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-none"
              >
                <Icon size={17} />
                <span>{item.label}</span>
                {badge > 0 && <b className="nav-badge">{badge}</b>}
              </TabsTrigger>
            );
          })}
        </TabsList>
        <div className="admin-sidebar-foot">
          <strong>{user?.display_name || "Administrador"}</strong>
          <span>Administrador de iMarket</span>
          <button type="button" onClick={onLogout}><LogOut size={14} /> Salir</button>
        </div>
      </aside>

      <div className="admin-main">
        <div className="admin-topbar">
          <div>
            <span className="admin-eyebrow">Panel de administración · {monthLabel}</span>
            <h1>{current.id === "resumen" ? "Resumen de ventas" : current.label}</h1>
          </div>
          <Link href="/" className="admin-back-link"><ArrowLeft size={15} /> Ver marketplace</Link>
        </div>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}

      <TabsContent value="resumen">
        {!metrics && (
          <div className="admin-kpis">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        )}
        {metrics && (
          <>
            <div className="admin-kpis">
              <div className="admin-card kpi">
                <span>Ventas del mes</span>
                <strong>{money(revenueNow)}</strong>
                <Delta current={revenueNow} previous={revenuePrev} />
              </div>
              <div className="admin-card kpi">
                <span>Ventas confirmadas</span>
                <strong>{salesNow}</strong>
                <Delta current={salesNow} previous={salesPrev} />
              </div>
              <div className="admin-card kpi">
                <span>Anuncios publicados</span>
                <strong>{metrics.publishedListings}</strong>
                <span className="delta delta-flat">{metrics.pendingListings} por revisar</span>
              </div>
              <div className="admin-card kpi">
                <span>Usuarios</span>
                <strong>{metrics.totalUsers}</strong>
                <span className="delta delta-flat">{metrics.suspendedUsers} suspendidos · {metrics.bannedUsers} baneados</span>
              </div>
            </div>

            <div className="admin-grid-2">
              <SalesChart sales={sales} />
              <TopModels sales={sales} />
            </div>

            <div className="admin-grid-2 admin-grid-bottom">
              <div className="admin-card">
                <div className="admin-card-head">
                  <h3>Ventas recientes</h3>
                  <button type="button" className="link-button" onClick={() => setTab("ventas")}>Ver todas</button>
                </div>
                {!sales.length && <p className="muted">Sin ventas registradas.</p>}
                <div className="recent-sales">
                  {sales.slice(0, 5).map((sale) => (
                    <div className="recent-sale" key={sale.id}>
                      <div className="recent-sale-main">
                        <strong>{sale.listing?.model || "iPhone"}</strong>
                        <small>Vendedor {sale.seller?.display_name || "—"} · Comprador {sale.buyer?.display_name || "sin vincular"}</small>
                      </div>
                      <SaleStatus sale={sale} />
                      <b className="recent-sale-price">{money(sale.sold_price_usd)}</b>
                    </div>
                  ))}
                </div>
              </div>
              <div className="admin-card">
                <div className="admin-card-head"><h3>Por atender</h3></div>
                <div className="attention-list">
                  {attention.map((item) => (
                    <button type="button" key={item.label} className="attention-row" onClick={() => setTab(item.tab)}>
                      <span>{item.label}</span>
                      <b className={`count-pill tone-${item.tone}`}>{item.value}</b>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
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
            Anuncios publicados ({published.length})
          </h4>
          {!published.length && (
            <p className="muted">Todavía no hay iPhone publicados.</p>
          )}
          <p className="muted">
            Los destacados aparecen en una franja especial al inicio del
            marketplace. Eliminar retira el anuncio de la tienda.
          </p>
          {published.map((listing) => (
            <div className="admin-row" key={listing.id}>
              <div>
                <strong>
                  {listing.model} · {storageLabel(listing.storage_gb)}
                </strong>
                <small>
                  {listing.seller?.display_name || "—"} · ${listing.price_usd}{" "}
                  USD{listing.featured_at ? " · Destacado" : ""}
                </small>
              </div>
              <div className="admin-row-actions">
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => removeListing(listing)}
              >
                <Trash2 size={13} />
                Eliminar
              </Button>
              </div>
            </div>
          ))}
      </TabsContent>

      <TabsContent value="pendientes">
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
                ${listing.price} USD · {storageLabel(listing.storage)} · Batería{" "}
                {listing.battery ?? "sin informar"} · {listing.condition}
                {listing.cosmeticIssues?.length > 0 &&
                  ` · Daños: ${listing.cosmeticIssues.map(cosmeticLabel).join(", ")}`}
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

      <TabsContent value="usuarios">
          <h4 className="profile-subheading">Usuarios ({users.length})</h4>
          {users.map((person) => (
            <div className="admin-row" key={person.id}>
              <div>
                <strong>
                  {person.display_name}
                  {roleRows.some((r) => r.user_id === person.id && r.role === "admin") && (
                    <span className="role-chip">Admin</span>
                  )}
                  {roleRows.some((r) => r.user_id === person.id && r.role === "moderator") && (
                    <span className="role-chip">Moderador</span>
                  )}
                </strong>
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
              {(() => {
                const roles = roleRows.filter((r) => r.user_id === person.id).map((r) => r.role);
                if (roles.includes("admin") || person.id === user?.id) return null;
                const isMod = roles.includes("moderator");
                return (
                  <Button
                    type="button"
                    variant={isMod ? "outline" : "ghost"}
                    size="sm"
                    disabled={busy}
                    onClick={() => toggleRole(person.id, "moderator", !isMod)}
                  >
                    {isMod ? "Quitar moderador" : "+ Moderador"}
                  </Button>
                );
              })()}
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
      </div>
    </Tabs>
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
