"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BatteryFull,
  ChevronLeft,
  ChevronRight,
  Heart,
  Info,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { timeAgo } from "../lib/catalog.mjs";

function Chips({ item }) {
  return (
    <div className="fs-chips">
      {item.battery ? (
        <span>
          <BatteryFull size={14} /> {item.battery} % batería
        </span>
      ) : null}
      {item.warrantyDays > 0 ? (
        <span>
          <ShieldCheck size={14} /> {item.warrantyDays} días de garantía
        </span>
      ) : null}
      {item.condition ? <span>{item.condition}</span> : null}
    </div>
  );
}

export default function FeaturedShowcase({
  items,
  favorites = [],
  onOpen,
  onContact,
  onToggleFavorite,
  onPromote,
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = items.length;

  useEffect(() => {
    if (index >= total) setIndex(0);
  }, [index, total]);

  useEffect(() => {
    if (total < 2 || paused) return undefined;
    const timer = setInterval(() => setIndex((i) => (i + 1) % total), 7000);
    return () => clearInterval(timer);
  }, [total, paused]);

  if (!total) return null;
  const main = items[index % total];
  const side = [1, 2]
    .map((step) => items[(index + step) % total])
    .filter((item, i, all) => item && item.id !== main.id && all.findIndex((x) => x.id === item.id) === i);
  const go = (step) => setIndex((i) => (i + step + total) % total);
  const liked = favorites.includes(main.id);

  return (
    <section
      className="featured-showcase"
      aria-label="Anuncios destacados"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="fs-head">
        <div>
          <span className="fs-kicker">
            <Sparkles size={13} /> DESTACADOS
          </span>
          <h2>Los iPhone que más brillan hoy</h2>
          <p>
            <Info size={14} /> Anuncios destacados por sus vendedores. Siempre con información clara.
          </p>
        </div>
        {total > 1 && (
          <div className="fs-pager" aria-label="Navegar destacados">
            <span>
              {(index % total) + 1} / {total}
            </span>
            <button type="button" onClick={() => go(-1)} aria-label="Anterior">
              <ChevronLeft size={18} />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Siguiente">
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      <div className="fs-grid">
        <article className="fs-main" key={main.id}>
          <span className="fs-badge">
            <Sparkles size={13} /> Destacado
          </span>
          <button type="button" className="fs-main-photo" onClick={() => onOpen(main)} aria-label={`Ver ${main.model}`}>
            <img src={main.image} alt={`${main.model} ${main.color}`} />
          </button>
          <div className="fs-main-body">
            <div className="fs-title-row">
              <div>
                <h3>{main.model}</h3>
                <p>
                  {main.storage} GB{main.factoryUnlocked ? " · Libre de fábrica" : ""}
                </p>
              </div>
              <button
                type="button"
                className={`fs-heart ${liked ? "liked" : ""}`}
                aria-pressed={liked}
                aria-label={liked ? "Quitar de favoritos" : "Guardar en favoritos"}
                onClick={() => onToggleFavorite(main.id)}
              >
                <Heart size={19} fill={liked ? "currentColor" : "none"} />
              </button>
            </div>
            <Chips item={main} />
            <div className="fs-price">
              ${main.price.toLocaleString("es")} <small>USD</small>
            </div>
            <div className="fs-seller">
              <span className="fs-avatar">{main.initials}</span>
              <div>
                <strong>
                  {main.seller} {main.verified && <BadgeCheck size={15} aria-label="Vendedor verificado" />}
                </strong>
                <small>
                  <MapPin size={12} /> {main.location}, La Habana · {timeAgo(main.hours)}
                </small>
              </div>
            </div>
            <button type="button" className="fs-primary" onClick={() => onOpen(main)}>
              Ver iPhone <ArrowUpRight size={16} />
            </button>
            <button type="button" className="fs-secondary" onClick={() => onContact(main)}>
              Escribir al vendedor
            </button>
          </div>
        </article>

        <div className="fs-side">
          {side.map((item) => (
            <button type="button" className="fs-mini" key={item.id} onClick={() => onOpen(item)}>
              <span className="fs-badge fs-badge-sm">
                <Sparkles size={11} /> Destacado
              </span>
              <span className="fs-mini-photo">
                <img src={item.image} alt={`${item.model} ${item.color}`} loading="lazy" />
              </span>
              <span className="fs-mini-body">
                <strong>{item.model}</strong>
                <small>
                  {item.storage} GB · {item.condition}
                </small>
                <Chips item={{ battery: item.battery, warrantyDays: item.warrantyDays }} />
                <span className="fs-mini-foot">
                  <b>
                    ${item.price.toLocaleString("es")} <small>USD</small>
                  </b>
                  <em>
                    Ver <ArrowRight size={14} />
                  </em>
                </span>
              </span>
            </button>
          ))}
          <button type="button" className="fs-cta" onClick={onPromote}>
            ¿Quieres destacar tu iPhone? <ArrowRight size={17} />
          </button>
        </div>
      </div>
    </section>
  );
}
