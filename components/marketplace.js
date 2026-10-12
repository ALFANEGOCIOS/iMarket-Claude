"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  ArrowRight,
  Search,
  Heart,
  Plus,
  MapPin,
  ChevronDown,
  SlidersHorizontal,
  ShieldCheck,
  BadgeCheck,
  BatteryFull,
  Check,
  X,
  Star,
  Clock3,
  Smartphone,
  Handshake,
  ArrowUpDown,
  Menu,
  MessageCircle,
  UserRound,
  LogOut,
  PackageCheck,
  Camera,
  Sparkles,
  Bell,
} from "lucide-react";
import {
  demoListings,
  defaultFilters,
  filterListings,
  municipalities,
  money,
} from "../lib/catalog.mjs";
import { publicError } from "../lib/database.mjs";
import useRemoteMarketplace from "../hooks/use-remote-marketplace";
import {
  VerificationForm,
  AccountSettings,
  Inbox,
  ReportForm,
} from "./live-panels";
import { toast } from "sonner";
import Modal from "./modal";
import FeaturedShowcase from "./featured-showcase";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import { Slider } from "./ui/slider";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./ui/select";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "./ui/tooltip";
import PublishForm from "./publish-form";

const storageKey = "imarket-demo-v1";
const infoContent = {
  how: {
    title: "Un buen iPhone. Un trato entre personas.",
    intro: "Así funciona iMarket",
    items: [
      [
        "01",
        "Encuentra el tuyo",
        "Explora los anuncios y compara el estado, la batería y el precio. Guarda tus favoritos para decidir con calma.",
      ],
      [
        "02",
        "Conoce a su propietario",
        "Consulta su perfil, resuelve tus dudas y acuerda un encuentro en un lugar público de La Habana.",
      ],
      [
        "03",
        "Revísalo y estrena",
        "Comprueba el iPhone antes de pagar. El vendedor marca la venta como completada y puede compartir su experiencia.",
      ],
    ],
  },
  safety: {
    title: "La confianza empieza por los detalles.",
    intro: "Compra con tranquilidad",
    items: [
      [
        "01",
        "Verifica antes de pagar",
        "Revisa el IMEI, el bloqueo de activación, Face ID, cámaras y salud de batería. Pide al propietario que cierre su sesión de iCloud.",
      ],
      [
        "02",
        "Queda en un lugar público",
        "Evita anticipos y enlaces de pago desconocidos. Tómate el tiempo necesario para revisar el dispositivo en persona.",
      ],
      [
        "03",
        "Tus datos son tuyos",
        "Tu dirección exacta y tus documentos de identidad nunca deben aparecer en un anuncio público. Una identidad verificada no garantiza el estado del equipo.",
      ],
    ],
  },
  terms: {
    title: "Una comunidad de propietarios.",
    intro: "Condiciones de la versión de prueba",
    items: [
      [
        "01",
        "Solo propietarios",
        "Al publicar confirmas que el dispositivo es tuyo. No se permiten gestores de ventas, anuncios ajenos ni dispositivos de procedencia ilícita.",
      ],
      [
        "02",
        "Información transparente",
        "Describe el estado real del equipo, sus reparaciones y cualquier fallo. Las fotos deben ser tuyas y representar el dispositivo anunciado.",
      ],
      [
        "03",
        "Acuerdos entre personas",
        "iMarket facilita el encuentro. El pago, la entrega y la garantía se acuerdan entre comprador y vendedor. Esta versión utiliza anuncios de ejemplo y no procesa transacciones.",
      ],
    ],
  },
};

export default function Marketplace() {
  const router = useRouter();
  const [filters, setFilters] = useState({ ...defaultFilters });
  const [demoFavorites, setFavorites] = useState([]);
  const [demoOwnListings, setOwnListings] = useState([]);
  const [demoUser, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [ready, setReady] = useState(false);
  const [viewTime] = useState(() => Date.now());
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [mobileFilters, setMobileFilters] = useState(false);
  useEffect(() => {
    if (!mobileFilters) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event) => {
      if (event.key === "Escape") setMobileFilters(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileFilters]);
  const [navOpen, setNavOpen] = useState(false);
  const [visible, setVisible] = useState(6);
  const remote = useRemoteMarketplace(filters, visible);
  const live = remote.live;
  const user = live ? remote.user : demoUser;
  const favorites = live ? remote.favorites : demoFavorites;
  const ownListings = live ? remote.owned : demoOwnListings;
  const sales = live ? remote.sales || [] : [];
  const [operationBusy, setOperationBusy] = useState(false);
  const [saleId, setSaleId] = useState(null);
  const [authMessage, setAuthMessage] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);
  const [contact, setContact] = useState(false);
  const [soldId, setSoldId] = useState(null);
  const [saleBuyers, setSaleBuyers] = useState([]);
  const [reviewRating, setReviewRating] = useState("5");
  const notify = useCallback((message) => {
    toast(message);
  }, []);
  const closeModal = useCallback(() => {
    setModal((current) => {
      if (current === "inbox" && live) remote.refresh();
      return null;
    });
    setContact(false);
    setAuthMessage("");
  }, [live, remote]);
  const unreadSeen = useRef(0);
  useEffect(() => {
    if (!live) return;
    const count = remote.unread.length;
    if (count > unreadSeen.current && unreadSeen.current > 0) {
      const last = remote.unread[0];
      const model = last?.conversation?.listing?.model;
      notify(
        model
          ? `Nuevo mensaje sobre tu ${model}. Toca la campana para verlo.`
          : "Tienes un mensaje nuevo. Toca la campana para verlo.",
      );
    }
    unreadSeen.current = count;
  }, [live, remote.unread, notify]);
  useEffect(() => {
    if (live) return;
    // Browser persistence is loaded after hydration; server rendering has no localStorage.
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (saved) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFavorites(saved.favorites || []);
        setOwnListings(saved.listings || []);
        setUser(saved.user || null);
        setMessages(saved.messages || []);
        setReviews(saved.reviews || []);
      }
    } catch {
      /* Ignore unavailable or corrupt browser storage. */
    }
    setReady(true);
    return () => clearTimeout(timer.current);
  }, [live]);
  useEffect(() => {
    if (live || !ready) return;
    // Surface browser storage failures after the write attempt.
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          favorites,
          listings: ownListings,
          user,
          messages,
          reviews,
        }),
      );
    } catch {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      notify(
        "No hay espacio para guardar los cambios. Se conservarán solo mientras esta página esté abierta.",
      );
    }
  }, [live, ready, favorites, ownListings, user, messages, reviews, notify]);
  const listings = live
    ? remote.items
    : [
        ...ownListings.map((item) => ({
          ...item,
          hours: item.createdAt
            ? Math.max(
                0,
                Math.floor(
                  (viewTime - new Date(item.createdAt).getTime()) / 3600000,
                ),
              )
            : 0,
        })),
        ...demoListings,
      ];
  const results = live
    ? listings
    : filterListings(listings, { ...filters, favorites });
  const resultCount = live ? remote.total : results.length;
  const activeCount =
    filters.models.length +
    filters.storage.length +
    filters.conditions.length +
    Number(!!filters.minPrice) +
    Number(!!filters.maxPrice) +
    Number(!!filters.minBattery) +
    Number(!!filters.location) +
    Number(filters.verified) +
    Number(filters.warranty);
  const update = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setVisible(6);
  };
  const toggleFilter = (key, value) =>
    update(
      key,
      filters[key].includes(value)
        ? filters[key].filter((item) => item !== value)
        : [...filters[key], value],
    );
  async function toggleFavorite(id) {
    if (live) {
      if (!user) {
        router.push("/login");
        return;
      }
      if (operationBusy) return;
      setOperationBusy(true);
      try {
        await remote.favorite(id);
      } catch (error) {
        notify(publicError(error));
      } finally {
        setOperationBusy(false);
      }
      return;
    }
    setFavorites((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id],
    );
  }
  function explore() {
    document
      .getElementById("catalogue")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
    setNavOpen(false);
  }
  function openListing(item) {
    setSelected(item);
    setActivePhoto(0);
    setContact(false);
    setModal("detail");
  }
  function openPublish() {
    if (live && user && (user.is_suspended || user.is_banned)) {
      notify("Tu cuenta no puede publicar en este momento.");
      return;
    }
    if (live && user?.account_type !== "individual" && user) {
      notify("iMarket admite anuncios de propietarios individuales.");
      return;
    }
    if (!user) {
      router.push("/login");
      setNavOpen(false);
      return;
    }
    setModal(
      live && user.verification_status !== remote.contract?.verified
        ? "verification"
        : "publish",
    );
    setAuthMessage("");
    setNavOpen(false);
  }
  function authenticate(event) {
    event?.preventDefault();
    router.push("/login");
  }
  async function publish(item) {
    if (live) {
      await remote.publish(item);
      closeModal();
      notify("Tu anuncio se envió a revisión. Aparecerá cuando sea aprobado.");
      return;
    }
    setOwnListings((previous) => [item, ...previous]);
    closeModal();
    setFilters({ ...defaultFilters });
    notify(
      "Tu anuncio de prueba está listo. Solo es visible en este navegador.",
    );
    setTimeout(explore, 100);
  }
  async function markSold(item) {
    if (operationBusy) return;
    setOperationBusy(true);
    try {
      if (live) {
        const receipt = await remote.reportSale(item.id);
        setSaleId(receipt.sale_id);
        setSoldId(item.id);
        const conversations = await remote.repository.conversations();
        const candidates = conversations.filter(
          (c) => c.listing_id === item.id && c.seller_id === user.id,
        );
        setSaleBuyers(candidates);
        setModal(candidates.length ? "assign-buyer" : "review");
      } else {
        setOwnListings((previous) =>
          previous.map((x) => (x.id === item.id ? { ...x, sold: true } : x)),
        );
        setSoldId(item.id);
        setModal("review");
      }
      notify("Tu anuncio se ha marcado como vendido.");
    } catch (error) {
      notify(publicError(error));
    } finally {
      setOperationBusy(false);
    }
  }
  async function confirmPurchase(sale) {
    if (operationBusy) return;
    setOperationBusy(true);
    try {
      await remote.confirmSale(sale.id);
      notify("Confirmaste la compra. ¡Gracias por usar iMarket!");
    } catch (error) {
      notify(publicError(error));
    } finally {
      setOperationBusy(false);
    }
  }
  async function pickBuyer(buyerId) {
    if (operationBusy) return;
    setOperationBusy(true);
    try {
      if (buyerId) await remote.repository.assignSaleBuyer(saleId, buyerId);
      setModal("review");
    } catch (error) {
      notify(publicError(error));
    } finally {
      setOperationBusy(false);
    }
  }
  async function submitReview(event) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    setOperationBusy(true);
    try {
      if (live) await remote.review(saleId, reviewRating, data.comment);
      else
        setReviews((previous) => [
          { ...data, listingId: soldId, date: new Date().toISOString() },
          ...previous,
        ]);
      setModal("profile");
      notify(
        live
          ? "Gracias. Tu reseña se ha guardado."
          : "¡Gracias! Tu reseña de prueba se ha guardado en este navegador.",
      );
    } catch (error) {
      notify(publicError(error));
    } finally {
      setOperationBusy(false);
    }
  }
  async function sendContact(event) {
    event.preventDefault();
    const body = new FormData(event.currentTarget).get("message").trim();
    if (live && !user) {
      router.push("/login");
      return;
    }
    setOperationBusy(true);
    try {
      if (live) {
        await remote.sendMessage(selected.id, body);
        notify("Mensaje enviado. Puedes seguir la conversación en tu perfil.");
      } else {
        setMessages((previous) => [
          {
            id: crypto.randomUUID(),
            seller: selected.seller,
            model: selected.model,
            body,
          },
          ...previous,
        ]);
        notify(
          "Mensaje guardado como borrador de prueba. No se ha enviado al vendedor.",
        );
      }
      setContact(false);
    } catch (error) {
      notify(publicError(error));
    } finally {
      setOperationBusy(false);
    }
  }
  async function logout() {
    const client = remote.client;
    if (client) {
      const { error } = await client.auth.signOut();
      if (error) {
        notify("No se pudo cerrar la sesión. Inténtalo de nuevo.");
        return;
      }
    }
    setUser(null);
    closeModal();
    notify("Has cerrado tu sesión.");
  }
  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <a href="#" className="brand" aria-label="iMarket inicio">
            <img src="/brand/logo-icon.png" alt="" className="brand-logo" width="32" height="32" />
            iMarket
          </a>
          <nav
            className={navOpen ? "main-nav open" : "main-nav"}
            aria-label="Navegación principal"
          >
            <button
              className="active"
              onClick={() => {
                update("favoritesOnly", false);
                explore();
              }}
            >
              Explorar iPhones
            </button>
            <button
              onClick={() => {
                router.push("/como-funciona");
                setNavOpen(false);
              }}
            >
              Cómo funciona
            </button>
            <button
              onClick={() => {
                router.push("/seguridad");
                setNavOpen(false);
              }}
            >
              Comprar seguro <ArrowUpRight size={13} />
            </button>
          </nav>
          <div className="header-actions">
            
            {live && user && (
              <button
                className="icon-button notifications-nav"
                aria-label={`Mensajes sin leer (${remote.unread.length})`}
                onClick={() => setModal("inbox")}
              >
                <Bell size={20} />
                {remote.unread.length > 0 && (
                  <span className="favorite-count">
                    {remote.unread.length}
                  </span>
                )}
              </button>
            )}
            <button
              className={`icon-button favorites-nav ${filters.favoritesOnly ? "is-favorite" : ""}`}
              aria-label={`Ver favoritos (${favorites.length})`}
              onClick={() => {
                update("favoritesOnly", !filters.favoritesOnly);
                explore();
              }}
            >
              <Heart size={20} />
              {favorites.length > 0 && (
                <span className="favorite-count">{favorites.length}</span>
              )}
            </button>
            <span className="header-divider" />
            <button
              aria-label={user ? "Mi perfil" : "Iniciar sesión"}
              className="login-button"
              onClick={() => (user ? setModal("profile") : router.push("/login"))}
            >
              {user ? (
                <>
                  <UserRound size={17} />
                  <span>{user.name.split(" ")[0]}</span>
                </>
              ) : (
                <>
                  <UserRound className="mobile-account-icon" size={19} />
                  <span>Iniciar sesión</span>
                </>
              )}
            </button>
            <Button
              variant="default" size="sm" className="publish-header"
              onClick={openPublish}
            >
              <Plus size={17} /> Publicar iPhone
            </Button>
            <button
              className="icon-button menu-button"
              aria-label="Abrir menú"
              aria-expanded={navOpen}
              onClick={() => setNavOpen(!navOpen)}
            >
              <Menu size={23} />
            </button>
          </div>
        </div>
      </header>
      <main className="container">
        <div className="location-line">
          <span>
            <MapPin size={14} /> La Habana, Cuba <ChevronDown size={12} />
          </span>
          <span>De persona a persona. Así de simple.</span>
        </div>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="green-dot" /> TU IPHONE TIENE OTRA HISTORIA QUE
              CONTAR
            </div>
            <h1>
              Tu próximo iPhone.
              <br />
              Más cerca de{" "}
              <span className="hero-emphasis">
                ti.
                <svg viewBox="0 0 103 12" aria-hidden="true">
                  <path d="M3 8C23 1 66 0 98 5M9 11C45 5 79 6 93 7" />
                </svg>
              </span>
            </h1>
            <p>
              Compra y vende iPhones en La Habana.
              <br />
              Sin intermediarios. Con personas como tú.
            </p>
            <div className="hero-actions">
              <Button variant="default" onClick={explore}>
                Encuentra tu iPhone <ArrowUpRight size={18} />
              </Button>
              <Button variant="link" onClick={openPublish}>
                Quiero vender <ArrowRight size={17} />
              </Button>
            </div>
            <div className="community">
              <div className="avatar-stack">
                <img src="/images/avatar-1.jpg" alt="" />
                <img src="/images/avatar-2.jpg" alt="" />
                <img src="/images/avatar-3.jpg" alt="" />
                <span>
                  <Heart size={12} />
                </span>
              </div>
              <div>
                <span className="community-stars">★★★★★</span>
                <p>Buenos iPhones. Mejores conexiones.</p>
              </div>
            </div>
          </div>
          <div className="hero-art">
            <div className="hero-orbit orbit-one" />
            <div className="hero-orbit orbit-two" />
            <div className="hero-orbit orbit-three" />
            <span className="art-plus plus-one">✦</span>
            <span className="art-plus plus-two">✧</span>
            <div className="hero-phone-shadow" />
            <img
              className="hero-phone"
              src="/images/iphone-natural.webp"
              alt="iPhone Pro en titanio natural, vista frontal y trasera"
              fetchPriority="high"
            />
            <div className="floating-label trusted-label">
              <span className="floating-icon">
                <ShieldCheck size={23} />
              </span>
              <span>
                Tratos con confianza
                <strong>De propietario a propietario</strong>
              </span>
              <span className="little-dot" />
            </div>
            <div className="floating-label second-life">
              <span className="sparkle-circle">
                <Sparkles size={18} />
              </span>
              <div>
                Una segunda vida.<strong>La misma emoción.</strong>
              </div>
            </div>
            <span className="hero-caption">EL QUE QUIERES, MÁS CERCA.</span>
          </div>
        </section>
        {live && remote.featured?.length > 0 && (
          <FeaturedShowcase
            items={remote.featured}
            favorites={favorites}
            onOpen={openListing}
            onContact={(item) => {
              if (!user) {
                router.push("/login");
                return;
              }
              openListing(item);
              if (item.sellerId !== user.id) setContact(true);
            }}
            onToggleFavorite={toggleFavorite}
            onPromote={openPublish}
          />
        )}
        <section className="benefits" aria-label="Ventajas de iMarket">
          <div>
            <span className="benefit-icon">
              <BadgeCheck size={22} />
            </span>
            <p>
              <strong>Personas reales</strong>
              <span>Una comunidad de propietarios</span>
            </p>
          </div>
          <div>
            <span className="benefit-icon">
              <Handshake size={23} />
            </span>
            <p>
              <strong>Sin intermediarios</strong>
              <span>Habla directo con quien lo vende</span>
            </p>
          </div>
          <div>
            <span className="benefit-icon">
              <MapPin size={22} />
            </span>
            <p>
              <strong>Aquí, en La Habana</strong>
              <span>Encuentra tu iPhone cerca de ti</span>
            </p>
          </div>
          <button onClick={() => router.push("/seguridad")}>
            <span className="benefit-icon">
              <ShieldCheck size={23} />
            </span>
            <p>
              <strong>Compra con confianza</strong>
              <span>Los detalles claros, desde el inicio</span>
            </p>
            <ArrowUpRight size={15} />
          </button>
        </section>
        <section id="catalogue" className="catalogue">
          <div className="catalogue-heading">
            <div className="section-kicker">
              <span /> EL TUYO TE ESTÁ ESPERANDO
            </div>
            <div className="catalogue-title-row">
              <h2>
                {filters.favoritesOnly
                  ? "Tus iPhones favoritos"
                  : "Encuentra tu próximo iPhone"}
                <span>.</span>
              </h2>
              <span className="listing-count">
                {resultCount} iPhones disponibles
              </span>
            </div>
          </div>
          <div className="catalogue-layout">
            <aside
              className={`filter-sidebar ${mobileFilters ? "mobile-open" : ""}`}
            >
              <div className="filter-heading">
                <h3>
                  <SlidersHorizontal size={17} /> Filtros{" "}
                  {activeCount > 0 && (
                    <span className="filter-counter">{activeCount}</span>
                  )}
                </h3>
                <button
                  className="reset-button"
                  onClick={() =>
                    setFilters({
                      ...defaultFilters,
                      favoritesOnly: filters.favoritesOnly,
                    })
                  }
                >
                  Limpiar
                </button>
                <button
                  className="mobile-filter-close icon-button"
                  aria-label="Cerrar filtros"
                  onClick={() => setMobileFilters(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <Accordion type="single" collapsible className="filter-group filter-accordion">
                <AccordionItem value="modelo">
                  <AccordionTrigger>Modelo</AccordionTrigger>
                  <AccordionContent>
                    {["iPhone 18","iPhone 17","iPhone 16","iPhone 15","iPhone 14","iPhone 13","iPhone 12","iPhone 11","iPhone X","iPhone SE","iPhone 8","iPhone 7","iPhone 6"].map((model) => (
                      <label className="filter-checkbox" key={model}>
                        <Checkbox
                          checked={filters.models.includes(model)}
                          onCheckedChange={() => toggleFilter("models", model)}
                        />
                        <span>{model}</span>
                      </label>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              <div className="filter-group">
                <h4>
                  Precio <span>USD</span>
                </h4>
                <div className="price-inputs">
                  <label>
                    <span>Desde</span>
                    <Input
                      type="number"
                      min="0"
                      aria-label="Precio mínimo"
                      placeholder="$ 0"
                      value={filters.minPrice}
                      onChange={(e) => update("minPrice", e.target.value)}
                    />
                  </label>
                  <span>—</span>
                  <label>
                    <span>Hasta</span>
                    <Input
                      type="number"
                      min="0"
                      aria-label="Precio máximo"
                      placeholder="$ 1,500"
                      value={filters.maxPrice}
                      onChange={(e) => update("maxPrice", e.target.value)}
                    />
                  </label>
                </div>
                <Slider
                  className="price-range"
                  min={0}
                  max={1500}
                  step={25}
                  aria-label="Presupuesto máximo"
                  value={[Number(filters.maxPrice) || 1500]}
                  onValueChange={([v]) => update("maxPrice", v)}
                />
              </div>
              <Accordion type="single" collapsible defaultValue="almacenamiento" className="filter-group filter-accordion">
                <AccordionItem value="almacenamiento">
                  <AccordionTrigger>Almacenamiento</AccordionTrigger>
                  <AccordionContent>
                    <div className="storage-options">
                      {[16, 32, 64, 128, 256, 512, 1024].map((size) => (
                        <button
                          key={size}
                          aria-pressed={filters.storage.includes(size)}
                          className={filters.storage.includes(size) ? "selected" : ""}
                          onClick={() => toggleFilter("storage", size)}
                        >
                          {size === 1024 ? "1 TB" : `${size} GB`}
                        </button>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              <Accordion type="single" collapsible defaultValue="condicion" className="filter-group filter-accordion">
                <AccordionItem value="condicion">
                  <AccordionTrigger>Condición</AccordionTrigger>
                  <AccordionContent>
                    {["Como nuevo", "Excelente", "Buen estado"].map((condition) => (
                      <label key={condition} className="filter-checkbox">
                        <Checkbox
                          checked={filters.conditions.includes(condition)}
                          onCheckedChange={() => toggleFilter("conditions", condition)}
                        />
                        <span>{condition}</span>
                      </label>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              <div className="filter-group">
                <h4>
                  Salud de batería <BatteryFull size={16} />
                </h4>
                <Select
                  value={String(filters.minBattery)}
                  onValueChange={(v) => update("minBattery", Number(v))}
                >
                  <SelectTrigger className="w-full" aria-label="Salud de batería mínima">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Cualquier porcentaje</SelectItem>
                    <SelectItem value="90">90 % o más</SelectItem>
                    <SelectItem value="95">95 % o más</SelectItem>
                    <SelectItem value="100">100 %</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="filter-group">
                <h4>
                  Municipio <MapPin size={15} />
                </h4>
                <Select
                  value={filters.location || "all"}
                  onValueChange={(v) => update("location", v === "all" ? "" : v)}
                >
                  <SelectTrigger className="w-full" aria-label="Filtrar por municipio">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toda La Habana</SelectItem>
                    {municipalities.map((x) => (
                      <SelectItem key={x} value={x}>
                        {x}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="filter-group last">
                <label className="filter-checkbox">
                  <Checkbox
                    checked={filters.verified}
                    onCheckedChange={(v) => update("verified", Boolean(v))}
                  />
                  <span>Vendedores verificados</span>
                </label>
                <label className="filter-checkbox">
                  <Checkbox
                    checked={filters.warranty}
                    onCheckedChange={(v) => update("warranty", Boolean(v))}
                  />
                  <span>Con garantía</span>
                </label>
              </div>
              <div className="seller-callout">
                <Smartphone size={23} />
                <h4>
                  ¿Tu iPhone busca
                  <br />
                  nuevo dueño?
                </h4>
                <p>
                  Dale otra historia.
                  <br />
                  Publicar es gratis.
                </p>
                <button onClick={openPublish}>
                  Vender mi iPhone <ArrowUpRight size={16} />
                </button>
              </div>
              <Button
                variant="default" className="mobile-filter-apply"
                onClick={() => setMobileFilters(false)}
              >
                Ver {results.length} resultados
              </Button>
            </aside>
            <div className="catalogue-main">
              {live && remote.error && (
                <div className="notice" role="alert">
                  {remote.error}{" "}
                  <Button variant="link" onClick={remote.refresh}>
                    Reintentar
                  </Button>
                </div>
              )}
              <div className="search-toolbar">
                <div className="search-field">
                  <Search size={19} />
                  <Input
                    type="search"
                    aria-label="Buscar iPhone"
                    placeholder="¿Qué iPhone estás buscando?"
                    value={filters.query}
                    onChange={(e) => update("query", e.target.value)}
                  />
                  <kbd>⌕</kbd>
                </div>
                <button
                  className="mobile-filter-button"
                  onClick={() => setMobileFilters(true)}
                >
                  <SlidersHorizontal size={18} /> Filtros{" "}
                  {activeCount > 0 ? `(${activeCount})` : ""}
                </button>
                <label className="sort-field">
                  <ArrowUpDown size={15} />
                  <Select value={filters.sort} onValueChange={(v) => update("sort", v)}>
                    <SelectTrigger className="w-fit" aria-label="Ordenar publicaciones">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Más recientes</SelectItem>
                      <SelectItem value="price-asc">Menor precio</SelectItem>
                      <SelectItem value="price-desc">Mayor precio</SelectItem>
                      <SelectItem value="battery">Mejor batería</SelectItem>
                    </SelectContent>
                  </Select>
                </label>
              </div>
              <div className="quick-filters">
                <button
                  className={
                    !filters.models.length && !filters.favoritesOnly
                      ? "selected"
                      : ""
                  }
                  onClick={() => {
                    setFilters({ ...defaultFilters });
                    setVisible(6);
                  }}
                >
                  Todos los iPhones
                </button>
                {["iPhone 18", "iPhone 17", "iPhone 16", "iPhone 15", "iPhone 14"].map(
                  (model) => (
                    <button
                      key={model}
                      className={
                        filters.models.length === 1 &&
                        filters.models[0] === model
                          ? "selected"
                          : ""
                      }
                      onClick={() =>
                        update(
                          "models",
                          filters.models.length === 1 &&
                            filters.models[0] === model
                            ? []
                            : [model],
                        )
                      }
                    >
                      {model}
                    </button>
                  ),
                )}
                <button
                  className={`favorites-chip ${filters.favoritesOnly ? "selected" : ""}`}
                  onClick={() =>
                    update("favoritesOnly", !filters.favoritesOnly)
                  }
                >
                  <Heart size={13} /> Favoritos
                </button>
              </div>
              {activeCount > 0 && (
                <div className="active-filters">
                  <span>
                    {activeCount}{" "}
                    {activeCount === 1 ? "filtro activo" : "filtros activos"}
                  </span>
                  <button
                    onClick={() =>
                      setFilters({
                        ...defaultFilters,
                        favoritesOnly: filters.favoritesOnly,
                      })
                    }
                  >
                    Borrar filtros <X size={12} />
                  </button>
                </div>
              )}
              {live && remote.loading && !results.length ? (
                <div className="product-grid" role="status" aria-label="Cargando iPhones">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div className="product-card-skeleton" key={i}>
                      <Skeleton className="skeleton-image" />
                      <Skeleton className="skeleton-line" />
                      <Skeleton className="skeleton-line short" />
                    </div>
                  ))}
                </div>
              ) : results.length ? (
                <div className="product-grid">
                  {results.slice(0, visible).map((item) => (
                    <article className="product-card" key={item.id}>
                      <div
                        className={`product-visual visual-${item.color === "Rosa" ? "pink" : item.color === "Verde" ? "green" : "neutral"}`}
                      >
                        <button
                          className="product-image-button"
                          aria-label={`Ver ${item.model} ${item.storage} GB por ${item.price} USD`}
                          onClick={() => openListing(item)}
                        >
                          <img
                            src={item.image}
                            alt={`${item.model} en ${item.color}`}
                            loading="lazy"
                          />
                        </button>
                        <span
                          className={`condition-badge ${item.condition === "Como nuevo" ? "mint" : ""}`}
                        >
                          <span />
                          {item.condition}
                        </span>
                        <button
                          aria-label={`${favorites.includes(item.id) ? "Quitar de" : "Añadir a"} favoritos ${item.model} ${item.color}`}
                          aria-pressed={favorites.includes(item.id)}
                          className={`favorite-button ${favorites.includes(item.id) ? "is-favorite" : ""}`}
                          onClick={() => toggleFavorite(item.id)}
                        >
                          <Heart
                            size={17}
                            fill={
                              favorites.includes(item.id)
                                ? "currentColor"
                                : "none"
                            }
                          />
                        </button>
                        {item.warrantyDays > 0 && (
                          <span className="warranty-badge">
                            <ShieldCheck size={12} /> {item.warrantyDays} días
                            de garantía
                          </span>
                        )}
                      </div>
                      <div className="product-content">
                        <button
                          className="product-title"
                          onClick={() => openListing(item)}
                        >
                          {item.model}
                          <ArrowUpRight size={17} />
                        </button>
                        <p className="product-subtitle">
                          {item.storage} GB <span>·</span> {item.color}
                        </p>
                        <div className="product-specs">
                          <span
                            className={item.battery >= 95 ? "battery-good" : ""}
                          >
                            <BatteryFull size={14} />
                            {item.battery === null
                              ? "Batería sin informar"
                              : `${item.battery}% batería`}
                          </span>
                          <span>
                            <Check size={13} />
                            {item.factoryUnlocked
                              ? "Libre de fábrica"
                              : "Con operador"}
                          </span>
                        </div>
                        <div className="product-price">
                          <strong>
                            ${money(item.price)} <small>USD</small>
                          </strong>
                          <span>
                            <Clock3 size={12} />
                            {item.hours ? `Hace ${item.hours} h` : "Ahora"}
                          </span>
                        </div>
                        <div className="product-location">
                          <MapPin size={12} />
                          {item.location}
                        </div>
                        <div className="seller-row">
                          <span
                            className="seller-avatar"
                            style={{ background: item.avatar }}
                          >
                            {item.initials}
                          </span>
                          <span className="seller-name">
                            {item.seller}
                            {item.verified && (
                              <BadgeCheck size={14} className="verified-icon" />
                            )}
                          </span>
                          {item.rating ? (
                            <span className="seller-rating">
                              <Star size={12} fill="currentColor" />
                              {item.rating.toFixed(1)}{" "}
                              <small>({item.sales})</small>
                            </span>
                          ) : (
                            <Badge variant="secondary" className="new-seller">Nuevo</Badge>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <Search size={35} />
                  <h3>
                    {filters.favoritesOnly
                      ? "Tu próxima historia puede empezar aquí"
                      : "Todavía no encontramos ese iPhone"}
                  </h3>
                  <p>
                    {filters.favoritesOnly
                      ? "Toca el corazón de un anuncio para guardarlo en tus favoritos."
                      : "Prueba con otro modelo o amplía tus filtros de búsqueda."}
                  </p>
                  <Button
                    variant="default"
                    onClick={() => setFilters({ ...defaultFilters })}
                  >
                    Explorar todos los iPhones
                  </Button>
                </div>
              )}
              {resultCount > visible && (
                <button
                  className="load-more"
                  disabled={live && remote.loading}
                  onClick={() => setVisible(visible + 6)}
                >
                  Ver más iPhones <ChevronDown size={16} />
                </button>
              )}
              <div className="catalogue-end">
                <span />
                <p>
                  <ShieldCheck size={14} /> Un buen trato empieza con
                  información clara.
                </p>
                <span />
              </div>
              {!live && (
                <p className="demo-caption">
                  Anuncios de ejemplo para explorar iMarket. No son ofertas
                  reales.
                </p>
              )}
            </div>
          </div>
        </section>
        <section className="bottom-banner">
          <div className="banner-icon">
            <Smartphone size={32} />
            <Sparkles size={22} />
          </div>
          <div>
            <span>CAMBIAR DE IPHONE EMPIEZA AQUÍ</span>
            <h2>Tu iPhone aún tiene mucho por vivir.</h2>
            <p>Encuéntrale un nuevo dueño. Sin intermediarios y a tu ritmo.</p>
          </div>
          <Button variant="default" onClick={openPublish}>
            Publicar mi iPhone <ArrowUpRight size={17} />
          </Button>
        </section>
      </main>
      <footer className="container footer">
        <a className="brand" href="#">
          <img src="/brand/logo-icon.png" alt="" className="brand-logo" width="32" height="32" />
            iMarket
        </a>
        <p>Hecho para conectar, aquí en La Habana.</p>
        <div>
          <button onClick={() => router.push("/como-funciona")}>
            Cómo funciona
          </button>
          <button onClick={() => router.push("/terminos")}>Condiciones de uso</button>
          <button onClick={() => router.push("/seguridad")}>
            Seguridad y privacidad
          </button>
          <span>© {new Date().getFullYear()} iMarket</span>
        </div>
      </footer>

      {modal && (
        <Modal
          title={
            modal === "detail"
              ? selected.model
              : modal === "auth"
                ? "Tu próxima historia empieza aquí"
                : modal === "publish"
                  ? "Publicar mi iPhone"
                  : modal === "profile"
                    ? "Mi espacio"
                    : modal === "review"
                      ? "¿Cómo fue tu experiencia?"
                      : modal === "assign-buyer"
                        ? "Vincular comprador"
                        : modal === "verification"
                        ? "Verificar mi identidad"
                        : modal === "settings"
                          ? "Mis datos"
                          : modal === "inbox"
                            ? "Mis mensajes"
                            : modal === "admin"
                              ? "Panel de revisión"
                              : modal === "report"
                                ? "Reportar anuncio"
                                : modal === "terms" && live
                                  ? "Condiciones de uso"
                                  : infoContent[modal]?.intro || "iMarket"
          }
          onClose={closeModal}
          wide={["detail", "publish", "admin", "inbox"].includes(modal)}
        >
          {infoContent[modal] && (
            <div className="info-body">
              <div className="intro-icon">
                <ShieldCheck size={30} />
              </div>
              <h3>{infoContent[modal].title}</h3>
              {infoContent[modal].items.map(([number, title, description]) => (
                <div className="info-step" key={number}>
                  <span>{number}</span>
                  <div>
                    <h4>{title}</h4>
                    <p>
                      {live && modal === "terms" && number === "03"
                        ? "iMarket facilita el encuentro. El pago, la entrega y la garantía se acuerdan entre comprador y vendedor. Los pagos se realizan fuera de la plataforma."
                        : description}
                    </p>
                  </div>
                </div>
              ))}
              <Button variant="secondary" className="w-full" onClick={closeModal}>
                Entendido <Check size={17} />
              </Button>
            </div>
          )}
          {modal === "auth" && (
            <form className="auth-form" onSubmit={authenticate}>
              <div className="intro-icon">
                <UserRound size={30} />
              </div>
              <p>Accede a tu cuenta para guardar favoritos, publicar y contactar con propietarios.</p>
              {!live && (
                <div className="notice">
                  <strong>Conoce iMarket en modo de prueba</strong>
                  <p>
                    No necesitas contraseña. Tu perfil y tus anuncios se
                    guardarán únicamente en este navegador; no se creará una
                    cuenta real.
                  </p>
                </div>
              )}
              <label className="stack-label">
                Tu nombre
                <input
                  name="name"
                  required
                  minLength={2}
                  maxLength={60}
                  placeholder="¿Cómo te llamas?"
                  autoComplete="given-name"
                />
              </label>
              <label className="stack-label">
                Correo electrónico
                <input
                  name="email"
                  required
                  type="email"
                  placeholder="hola@ejemplo.com"
                  autoComplete="email"
                />
              </label>
              <label className="terms-check">
                <Checkbox required />
                Acepto las condiciones de uso de iMarket y confirmo que soy
                mayor de edad.
              </label>
              <Button
                type="button"
                variant="link"
                onClick={() => router.push("/terminos")}
              >
                Leer condiciones de uso
              </Button>
              {authMessage && (
                <p role="status" className="notice">
                  {authMessage}
                </p>
              )}
              <Button
                variant="default" className="w-full"
                disabled={authLoading}
                type="submit"
              >
                {authLoading
                  ? "Abriendo…"
                  : live
                    ? "Ir a iniciar sesión"
                    : "Entrar a la versión de prueba"}
                <ArrowRight size={17} />
              </Button>
              <p className="auth-note">
                <ShieldCheck size={14} /> Tus documentos de identidad nunca
                serán públicos.
              </p>
            </form>
          )}
          {modal === "publish" && user && (
            <PublishForm onPublish={publish} user={user} live={live} />
          )}
          {modal === "detail" && selected && (
            <div className="detail-body">
              <div className="detail-top">
                <div className="detail-gallery">
                  <div className="detail-image">
                    <img
                      src={selected.photos?.[activePhoto] || selected.image}
                      alt={`${selected.model}, foto ${activePhoto + 1}`}
                    />
                    <button
                      className={`favorite-button ${favorites.includes(selected.id) ? "is-favorite" : ""}`}
                      aria-label="Guardar dispositivo en favoritos"
                      onClick={() => toggleFavorite(selected.id)}
                    >
                      <Heart
                        size={20}
                        fill={
                          favorites.includes(selected.id)
                            ? "currentColor"
                            : "none"
                        }
                      />
                    </button>
                  </div>
                  {selected.photos?.length > 1 && (
                    <div className="photo-thumbnails">
                      {selected.photos.map((photo, index) => (
                        <button
                          key={index}
                          className={activePhoto === index ? "selected" : ""}
                          onClick={() => setActivePhoto(index)}
                          aria-label={`Ver foto ${index + 1}`}
                        >
                          <img src={photo} alt="" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="detail-summary">
                  <span className="detail-condition">{selected.condition}</span>
                  <h3>{selected.model}</h3>
                  <p>
                    {selected.storage} GB · {selected.color}
                  </p>
                  <strong className="detail-price">
                    ${money(selected.price)} <small>USD</small>
                  </strong>
                  {(selected.negotiable || selected.acceptsTrade) && (
                    <p className="muted">
                      {selected.negotiable ? "Precio negociable" : ""}
                      {selected.negotiable && selected.acceptsTrade
                        ? " · "
                        : ""}
                      {selected.acceptsTrade ? "Acepta intercambio" : ""}
                    </p>
                  )}
                  <span className="detail-location">
                    <MapPin size={15} />
                    {selected.location}, La Habana
                  </span>
                  <span className="muted">
                    <Clock3 size={14} />{" "}
                    {selected.hours
                      ? `Publicado hace ${selected.hours} horas`
                      : "Publicado ahora"}
                  </span>
                  <div className="detail-seller">
                    <span
                      className="seller-avatar"
                      style={{ background: selected.avatar }}
                    >
                      {selected.initials}
                    </span>
                    <div>
                      <strong>
                        {selected.seller}{" "}
                        {selected.verified && (
                          <BadgeCheck size={15} className="verified-icon" />
                        )}
                      </strong>
                      <small>En iMarket desde {selected.joined}</small>
                      {selected.rating && (
                        <span className="seller-rating">
                          <Star size={12} fill="currentColor" />{" "}
                          {selected.rating.toFixed(1)} · {selected.sales} ventas
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="default" className="w-full"
                    disabled={live && selected.sellerId === user?.id}
                    onClick={() => {
                      if (live && !user) router.push("/login");
                      else setContact(!contact);
                    }}
                  >
                    <MessageCircle size={17} />
                    {contact ? "Cerrar mensaje" : "Contactar al vendedor"}
                  </Button>
                </div>
              </div>
              {contact && (
                <form className="contact-form" onSubmit={sendContact}>
                  <div className="notice">
                    {live
                      ? "Habla con el propietario y acuerda una revisión en persona."
                      : "Este anuncio es de prueba. Puedes guardar un borrador; no se enviará a una persona real."}
                  </div>
                  <label className="stack-label">
                    Tu mensaje
                    <Textarea
                      name="message"
                      required
                      minLength={5}
                      maxLength={1000}
                      defaultValue={`Hola, me interesa tu ${selected.model}. ¿Sigue disponible?`}
                    />
                  </label>
                  <Button
                    variant="secondary"
                    type="submit"
                    disabled={operationBusy}
                  >
                    {live ? "Enviar mensaje" : "Guardar borrador"}{" "}
                    <ArrowRight size={16} />
                  </Button>
                </form>
              )}
              <div className="detail-spec-grid">
                {[
                  [
                    BatteryFull,
                    "Batería",
                    `${selected.battery === null ? "Sin informar" : `${selected.battery}%`} · ${selected.originalBattery ? "Original" : selected.batteryType === "unknown" ? "Sin confirmar" : "Reemplazada"}`,
                  ],
                  [
                    ShieldCheck,
                    "Garantía",
                    selected.warrantyDays
                      ? `${selected.warrantyDays} días`
                      : "Sin garantía",
                  ],
                  [
                    Smartphone,
                    "Operador",
                    selected.factoryUnlocked
                      ? "Libre de fábrica"
                      : "Con operador",
                  ],
                  [
                    Check,
                    "Face ID",
                    selected.faceId ? "Funciona" : "No funciona",
                  ],
                  [
                    Sparkles,
                    "True Tone",
                    selected.trueTone ? "Funciona" : "No funciona",
                  ],
                  [
                    PackageCheck,
                    "Cable",
                    (selected.includesCable ?? selected.accessories)
                      ? "Incluido"
                      : "No incluido",
                  ],
                  [
                    PackageCheck,
                    "Cargador",
                    (selected.includesCharger ?? selected.accessories)
                      ? "Incluido"
                      : "No incluido",
                  ],
                ].map(([Icon, label, value]) => (
                  <div key={label}>
                    <Icon size={18} />
                    <span>
                      {label}
                      <strong>{value}</strong>
                    </span>
                  </div>
                ))}
              </div>
              <div className="detail-description">
                <h4>Una palabra de su propietario</h4>
                <p>{selected.description}</p>
                {selected.details && (
                  <>
                    <h4>Detalles del dispositivo</h4>
                    <p>{selected.details}</p>
                  </>
                )}
              </div>
              <div className="detail-tip">
                <ShieldCheck size={20} />
                <p>
                  Revísalo en persona, comprueba el bloqueo de iCloud y acuerda
                  la entrega en un lugar público.{" "}
                  <button onClick={() => router.push("/seguridad")}>
                    Más consejos de seguridad ↗
                  </button>
                </p>
              </div>
              {live && selected.sellerId !== user?.id && (
                <Button
                  variant="link"
                  onClick={() => setModal(user ? "report" : "auth")}
                >
                  Reportar este anuncio
                </Button>
              )}
              {selected.id.startsWith("demo-") && (
                <p className="demo-caption">
                  Perfil, verificación y reputación de ejemplo. Las imágenes son
                  ilustrativas.
                </p>
              )}
            </div>
          )}
          {modal === "profile" && user && (
            <div className="profile-body">
              <div className="profile-heading">
                <span className="profile-avatar">
                  {user.name.slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <h3>{user.name}</h3>
                  <p>{user.email}</p>
                  <span className="profile-status">
                    {live
                      ? `Cuenta conectada · ${user.verification_status === remote.contract?.verified ? "Identidad verificada" : remote.verification?.status === "pending" ? "En revisión" : remote.verification?.rejection_reason ? "Verificación rechazada" : "Por verificar"}`
                      : "Perfil de prueba · Sin verificación"}
                  </span>
                </div>
              </div>
              {live && remote.verification?.rejection_reason && (
                <p className="notice">
                  La solicitud fue rechazada:{" "}
                  {remote.verification.rejection_reason}
                </p>
              )}
              {live ? (
                <div className="profile-actions">
                  <Button variant="outline" size="sm" onClick={remote.refresh}>
                    Actualizar estado
                  </Button>
                  <Button
                    variant="outline" size="sm"
                    onClick={() => setModal("settings")}
                  >
                    Editar mis datos
                  </Button>
                  <Button
                    variant="outline" size="sm"
                    onClick={() => setModal("inbox")}
                  >
                    Mis mensajes
                  </Button>
                  {user.verification_status !== remote.contract?.verified && (
                    <Button
                      variant="outline" size="sm"
                      onClick={() => setModal("verification")}
                    >
                      Solicitar verificación
                    </Button>
                  )}
                  {remote.isAdmin && (
                    <Button
                      variant="outline" size="sm"
                      onClick={() => router.push("/dashboard")}
                    >
                      Revisar solicitudes
                    </Button>
                  )}
                </div>
              ) : (
                <div className="notice">
                  <ShieldCheck size={20} />
                  <p>
                    La verificación de identidad estará disponible al activar el
                    servicio. No subas documentos personales a la versión de
                    prueba.
                  </p>
                </div>
              )}
              <div className="profile-section-heading">
                <h4>Mis publicaciones ({ownListings.length})</h4>
                <Button variant="link" onClick={openPublish}>
                  <Plus size={15} /> Publicar
                </Button>
              </div>
              {!ownListings.length ? (
                <div className="small-empty">
                  <Smartphone size={26} />
                  <p>Tu primer anuncio empieza con unas buenas fotos.</p>
                  <Button variant="default" onClick={openPublish}>
                    Publicar mi iPhone
                  </Button>
                </div>
              ) : (
                ownListings.map((item) => (
                  <div className="own-listing" key={item.id}>
                    <img src={item.image} alt={item.model} />
                    <div>
                      <strong>{item.model}</strong>
                      <span>
                        ${money(item.price)} USD ·{" "}
                        {item.sold
                          ? "Vendido"
                          : live
                            ? item.status === remote.contract?.published
                              ? "Publicado"
                              : "En revisión"
                            : "Activo"}
                      </span>
                    </div>
                    {item.sold ? (
                      <Badge variant="secondary" className="sold-badge">
                        <Check size={14} /> Vendido
                      </Badge>
                    ) : live && item.status !== remote.contract?.published ? (
                      <Badge variant="outline" className="new-seller">Por revisar</Badge>
                    ) : (
                      <Button
                        variant="outline" size="sm"
                        disabled={operationBusy}
                        onClick={() => markSold(item)}
                      >
                        Marcar vendido
                      </Button>
                    )}
                  </div>
                ))
              )}
              {live &&
                sales.filter((s) => s.buyer_id === user.id).length > 0 && (
                  <>
                    <h4 className="profile-subheading">
                      Mis compras (
                      {sales.filter((s) => s.buyer_id === user.id).length})
                    </h4>
                    {sales
                      .filter((s) => s.buyer_id === user.id)
                      .map((sale) => (
                        <div className="own-listing" key={sale.id}>
                          <div>
                            <strong>{sale.listing?.model || "iPhone"}</strong>
                            <span>
                              ${money(sale.sold_price_usd)} USD · Vendedor{" "}
                              {sale.seller?.display_name || "—"}
                            </span>
                          </div>
                          {sale.status === "confirmed" ? (
                            <Badge variant="secondary" className="sold-badge">
                              <Check size={14} /> Confirmada
                            </Badge>
                          ) : (
                            <Button
                              variant="outline" size="sm"
                              disabled={operationBusy}
                              onClick={() => confirmPurchase(sale)}
                            >
                              Confirmar compra
                            </Button>
                          )}
                        </div>
                      ))}
                  </>
                )}
              {!live && messages.length > 0 && (
                <>
                  <h4 className="profile-subheading">
                    Mis borradores ({messages.length})
                  </h4>
                  {messages.map((message) => (
                    <div className="message-preview" key={message.id}>
                      <strong>
                        {message.model} · {message.seller}
                      </strong>
                      <p>{message.body}</p>
                      <small>Borrador local · No enviado</small>
                    </div>
                  ))}
                </>
              )}
              <Button variant="ghost" size="sm" className="logout-button" onClick={logout}>
                <LogOut size={16} /> Cerrar sesión
              </Button>
            </div>
          )}
          {live && user && modal === "verification" && (
            <VerificationForm
              repository={remote.repository}
              user={user}
              onComplete={() => {
                remote.refresh();
                closeModal();
                notify(
                  "Solicitud de identidad enviada. Te avisaremos de su estado en tu perfil.",
                );
              }}
            />
          )}
          {live && user && modal === "settings" && (
            <AccountSettings
              repository={remote.repository}
              user={user}
              onComplete={() => {
                remote.refresh();
                setModal("profile");
                notify("Tus datos se han guardado.");
              }}
            />
          )}
          {live && user && modal === "inbox" && (
            <Inbox repository={remote.repository} user={user} notify={notify} />
          )}
          {live && user && selected && modal === "report" && (
            <ReportForm
              repository={remote.repository}
              user={user}
              listing={selected}
              onComplete={() => {
                closeModal();
                notify("Tu reporte se envió al equipo de moderación.");
              }}
            />
          )}
          {live && modal === "assign-buyer" && (
            <div className="profile-body">
              <div className="intro-icon">
                <UserRound size={30} />
              </div>
              <h3>¿Quién te lo compró?</h3>
              <p className="muted">
                Vincula al comprador para que pueda confirmar la compra desde
                su cuenta. Solo aparecen personas que te escribieron por este
                anuncio.
              </p>
              {saleBuyers.map((conversation) => (
                <div className="admin-row" key={conversation.id}>
                  <div>
                    <strong>
                      {conversation.buyer?.display_name || "Comprador"}
                    </strong>
                  </div>
                  <Button
                    type="button"
                    variant="outline" size="sm"
                    disabled={operationBusy}
                    onClick={() => pickBuyer(conversation.buyer_id)}
                  >
                    Fue esta persona
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="link" className="w-full"
                onClick={() => pickBuyer(null)}
              >
                Prefiero no decirlo ahora
              </Button>
            </div>
          )}
          {modal === "review" && (
            <form className="review-form" onSubmit={submitReview}>
              <div className="intro-icon">
                <PackageCheck size={32} />
              </div>
              <h3>¡Una nueva historia en marcha!</h3>
              <p>
                Tu iPhone ya figura como vendido. ¿Qué te pareció usar iMarket?
              </p>
              <label className="stack-label">
                Tu valoración
                <Select value={reviewRating} onValueChange={setReviewRating}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 4, 3, 2, 1].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {"★".repeat(n)} — {n} de 5
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <label className="stack-label">
                Tu experiencia
                <Textarea
                  name="comment"
                  required
                  minLength={10}
                  maxLength={1000}
                  placeholder="¿Qué te gustó? ¿Qué podemos mejorar?"
                  rows={4}
                />
              </label>
              <Button variant="default" className="w-full" disabled={operationBusy}>
                {live ? "Guardar reseña" : "Guardar reseña de prueba"}
              </Button>
              <Button
                type="button"
                variant="link" className="w-full"
                onClick={() => setModal("profile")}
              >
                Ahora no
              </Button>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}
