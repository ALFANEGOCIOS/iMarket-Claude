"use client";
import { useEffect, useRef, useState } from "react";
import { Camera, Check, LoaderCircle, X, ShieldCheck } from "lucide-react";
import { municipalities, CONDITIONS, conditionNeedsIssues } from "../lib/catalog.mjs";
import { loadDraft, saveDraft, clearDraft } from "../lib/draft";
import { compressPhoto } from "../lib/images";
import { publicError } from "../lib/database.mjs";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./ui/select";

const MODELS = [
  "iPhone 18 Pro Max", "iPhone 18 Pro", "iPhone Duo",
  "iPhone 17 Pro Max", "iPhone 17 Pro", "iPhone 17 Air", "iPhone 17", "iPhone 17e",
  "iPhone 16 Pro Max", "iPhone 16 Pro", "iPhone 16 Plus", "iPhone 16", "iPhone 16e",
  "iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15 Plus", "iPhone 15",
  "iPhone 14 Pro Max", "iPhone 14 Pro", "iPhone 14 Plus", "iPhone 14",
  "iPhone 13 Pro Max", "iPhone 13 Pro", "iPhone 13", "iPhone 13 mini",
  "iPhone 12 Pro Max", "iPhone 12 Pro", "iPhone 12", "iPhone 12 mini",
  "iPhone SE", "iPhone 11 Pro Max", "iPhone 11 Pro", "iPhone 11",
  "iPhone XS Max", "iPhone XS", "iPhone XR", "iPhone X",
  "iPhone 8 Plus", "iPhone 8", "iPhone 7 Plus", "iPhone 7",
  "iPhone 6s Plus", "iPhone 6s", "iPhone 6 Plus", "iPhone 6",
];
import { COSMETIC_ISSUES } from "../lib/catalog.mjs";
import { colorsFor as localColorsFor } from "../lib/iphone-colors.mjs";
import { storagesFor as localStoragesFor, storageLabel } from "../lib/iphone-storage.mjs";
const CHECK_FIELDS = [
  ["factoryUnlocked", "Libre de fábrica"],
  ["faceId", "Face ID funciona"],
  ["trueTone", "True Tone funciona"],
  ["includesCable", "Incluye cable"],
  ["includesCharger", "Incluye cargador"],
  ["negotiable", "Precio negociable"],
  ["acceptsTrade", "Acepto intercambio"],
];

export default function PublishForm({ onPublish, user, live = false, colorCatalog = null, storageCatalog = null }) {
  const storagesFor = (name) => storageCatalog?.[name]?.length ? storageCatalog[name] : localStoragesFor(name);
  const colorsFor = (name) => colorCatalog?.[name]?.length ? colorCatalog[name] : localColorsFor(name);
  const [photos, setPhotos] = useState([]);
  const [listingId, setListingId] = useState(() => crypto.randomUUID());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [warranty, setWarranty] = useState(false);
  const [step, setStep] = useState(1);
  const [model, setModel] = useState("");
  const [color, setColor] = useState("");
  const [storage, setStorage] = useState("");
  const [condition, setCondition] = useState(CONDITIONS[1]);
  const [issues, setIssues] = useState([]);
  const [hasDamage, setHasDamage] = useState(false);
  const [fields, setFields] = useState({
    price: "",
    battery: "",
    neighborhood: "",
    warrantyDays: "",
    description: "",
    details: "",
  });
  const [draftReady, setDraftReady] = useState(false);
  const [restored, setRestored] = useState(false);
  const draftKey = `imarket-listing-${user?.id || "local"}`;
  const field = (name) => ({
    name,
    value: fields[name],
    onChange: (event) => {
      const value = event.target.value;
      setFields((previous) => ({ ...previous, [name]: value }));
    },
  });
  const showIssues =
    conditionNeedsIssues(condition) || (condition === "Como nuevo" && hasDamage);
  const issuesRequired = showIssues;
  const [batteryType, setBatteryType] = useState("original");
  const [location, setLocation] = useState("");
  const [checks, setChecks] = useState({
    factoryUnlocked: true,
    faceId: true,
    trueTone: true,
    includesCable: false,
    includesCharger: false,
    negotiable: false,
    acceptsTrade: false,
  });
  const [terms, setTerms] = useState(false);

  // Recupera el borrador al abrir el formulario.
  useEffect(() => {
    let active = true;
    loadDraft(draftKey).then((draft) => {
      if (!active) return;
      if (draft) {
        if (draft.listingId) setListingId(draft.listingId);
        setPhotos(draft.photos || []);
        setModel(draft.model || "");
        setColor(draft.color || "");
        setStorage(draft.storage || "");
        setCondition(draft.condition || CONDITIONS[1]);
        setIssues(draft.issues || []);
        setHasDamage(Boolean(draft.hasDamage));
        setBatteryType(draft.batteryType || "original");
        setLocation(draft.location || "");
        setChecks((previous) => ({ ...previous, ...(draft.checks || {}) }));
        setWarranty(Boolean(draft.warranty));
        setFields((previous) => ({ ...previous, ...(draft.fields || {}) }));
        setStep(2);
        setRestored(true);
      }
      setDraftReady(true);
    });
    return () => {
      active = false;
    };
  }, [draftKey]);
  // Guarda el borrador (con retraso corto) cada vez que cambia algo.
  const saveTimer = useRef(null);
  useEffect(() => {
    if (!draftReady || step === 1) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveDraft(draftKey, {
        listingId, photos, model, color, storage, condition, issues, hasDamage,
        batteryType, location, checks, warranty, fields,
      });
    }, 600);
    return () => clearTimeout(saveTimer.current);
  }, [draftReady, step, draftKey, listingId, photos, model, color, storage, condition,
      issues, hasDamage, batteryType, location, checks, warranty, fields]);
  async function discardDraft() {
    clearTimeout(saveTimer.current);
    await clearDraft(draftKey);
    setListingId(crypto.randomUUID());
    setPhotos([]); setModel(""); setColor(""); setStorage("");
    setCondition(CONDITIONS[1]); setIssues([]); setHasDamage(false);
    setBatteryType("original"); setLocation(""); setWarranty(false);
    setChecks({ factoryUnlocked: true, faceId: true, trueTone: true,
      includesCable: false, includesCharger: false, negotiable: false, acceptsTrade: false });
    setFields({ price: "", battery: "", neighborhood: "", warrantyDays: "", description: "", details: "" });
    setTerms(false);
    setRestored(false);
  }

  function toggleCheck(name, value) {
    setChecks((prev) => ({ ...prev, [name]: value }));
  }

  async function addPhotos(event) {
    const files = [...event.target.files];
    event.target.value = "";
    if (files.length + photos.length > 5) {
      setError("Puedes añadir hasta 5 fotos.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const processed = await Promise.all(files.map(compressPhoto));
      setPhotos((previous) => [...previous, ...processed]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function submit(event) {
    event.preventDefault();
    if (!photos.length) {
      setError("Añade al menos una foto de tu iPhone.");
      return;
    }
    if (!storage || !storagesFor(model).includes(Number(storage))) {
      setError("Elige el almacenamiento de tu iPhone de la lista.");
      return;
    }
    if (!color || !colorsFor(model).includes(color)) {
      setError("Elige el color de tu iPhone de la lista.");
      return;
    }
    if (issuesRequired && !issues.length) {
      setError(
        condition === "Como nuevo"
          ? "Marca qué daño estético tiene o desmarca la casilla."
          : "Marca al menos un daño estético: con esta condición es obligatorio.",
      );
      return;
    }
    if (!terms) {
      setError("Debes confirmar que eres el propietario del iPhone.");
      return;
    }
    const data = fields;
    setLoading(true);
    setError("");
    try {
      await onPublish({
        id: listingId,
        model,
        storage: Number(storage),
        price: Number(data.price),
        battery: Number(data.battery),
        condition,
        cosmeticIssues: showIssues ? issues : [],
        location,
        color,
        description: data.description,
        details: data.details,
        factoryUnlocked: checks.factoryUnlocked,
        faceId: checks.faceId,
        trueTone: checks.trueTone,
        originalBattery: batteryType === "original",
        batteryType,
        warrantyDays: warranty ? Number(data.warrantyDays) : 0,
        accessories: checks.includesCable && checks.includesCharger,
        includesCable: checks.includesCable,
        includesCharger: checks.includesCharger,
        negotiable: checks.negotiable,
        acceptsTrade: checks.acceptsTrade,
        neighborhood: data.neighborhood,
        image: photos[0],
        photos,
        seller: user.name,
        initials: user.name.slice(0, 2).toUpperCase(),
        avatar: "#dde4ec",
        rating: null,
        sales: 0,
        hours: 0,
        joined: new Intl.DateTimeFormat("es", {
          month: "long",
          year: "numeric",
        }).format(new Date()),
        verified: false,
        owner: true,
        createdAt: new Date().toISOString(),
      });
      clearTimeout(saveTimer.current);
      await clearDraft(draftKey);
    } catch (failure) {
      setError(publicError(failure));
    } finally {
      setLoading(false);
    }
  }

  if (step === 1)
    return (
      <div className="publish-intro">
        <div className="intro-icon">
          <ShieldCheck size={34} />
        </div>
        <h3>De tu mano a una nueva historia.</h3>
        <p>
          En iMarket solo publican los propietarios de sus iPhones. Queremos que
          cada trato empiece con confianza.
        </p>
        <div className="notice">
          <strong>
            {live
              ? "Identidad verificada. Anuncio por revisar."
              : "Publicación de prueba"}
          </strong>
          <p>
            {live
              ? "Tu anuncio y tus fotos se guardarán en iMarket. El equipo revisará la publicación antes de mostrarla en el catálogo."
              : "Tu anuncio se guardará en este navegador. La verificación real de identidad y la publicación para otros usuarios estarán disponibles al activar el servicio."}
          </p>
        </div>
        <ul className="check-list">
          <li>
            <Check /> Hasta 5 fotos reales de tu dispositivo
          </li>
          <li>
            <Check /> Información clara sobre su estado
          </li>
          <li>
            <Check /> Tu municipio, sin mostrar tu dirección
          </li>
        </ul>
        <Button variant="secondary" className="w-full" onClick={() => setStep(2)}>
          Preparar mi anuncio <span>→</span>
        </Button>
      </div>
    );
  return (
    <form onSubmit={submit} className="publish-form">
      <p className="muted">
        Los pequeños detalles hacen grandes diferencias. Cuéntanos sobre tu
        iPhone.
      </p>
      {restored && (
        <div className="notice draft-notice">
          Recuperamos tu borrador. Tus datos y fotos se guardan solos mientras escribes.{" "}
          <button type="button" className="link-button" onClick={discardDraft}>
            Empezar de nuevo
          </button>
        </div>
      )}
      <Label>
        Fotos de tu iPhone <span>({photos.length}/5)</span>
      </Label>
      <div className="photo-uploads">
        {photos.map((photo, index) => (
          <div className="uploaded-photo" key={index}>
            <img src={photo} alt={`Foto ${index + 1} del dispositivo`} />
            <button
              type="button"
              aria-label={`Eliminar foto ${index + 1}`}
              onClick={() => setPhotos(photos.filter((_, i) => i !== index))}
            >
              <X size={14} />
            </button>
          </div>
        ))}
        {photos.length < 5 && (
          <label className="upload-button">
            {loading ? <LoaderCircle className="spin" /> : <Camera />}
            <span>{loading ? "Procesando…" : "Añadir fotos"}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={loading}
              onChange={addPhotos}
            />
          </label>
        )}
      </div>
      <small className="muted">
        JPG, PNG o WebP · Hasta 15 MB por foto · Optimizamos las fotos
        automáticamente.
      </small>
      <div className="form-grid">
        <label className="stack-label">
          Modelo
          <Select
            value={model}
            onValueChange={(value) => {
              setModel(value);
              setColor("");
              setStorage("");
            }}
            required
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona un modelo" />
            </SelectTrigger>
            <SelectContent>
              {MODELS.map((x) => (
                <SelectItem key={x} value={x}>
                  {x}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="stack-label">
          Almacenamiento
          <Select value={storage} onValueChange={setStorage} disabled={!model}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={model ? "Elige el almacenamiento" : "Primero elige el modelo"} />
            </SelectTrigger>
            <SelectContent>
              {storagesFor(model).map((x) => (
                <SelectItem key={x} value={String(x)}>
                  {storageLabel(x)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="stack-label">
          Precio (USD)
          <Input {...field("price")} type="number" inputMode="decimal" required min="1" max="10000" placeholder="Ej. 550" />
        </label>
        <label className="stack-label">
          Color
          <Select value={color} onValueChange={setColor} disabled={!model}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={model ? "Elige el color" : "Primero elige el modelo"} />
            </SelectTrigger>
            <SelectContent>
              {colorsFor(model).map((x) => (
                <SelectItem key={x} value={x}>
                  {x}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="stack-label">
          Condición estética
          <Select value={condition} onValueChange={setCondition}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONDITIONS.map((x) => (
                <SelectItem key={x} value={x}>
                  {x}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        {condition === "Como nuevo" && (
          <label className="checkbox-row">
            <Checkbox
              checked={hasDamage}
              onCheckedChange={(v) => setHasDamage(Boolean(v))}
            />
            Tiene algún daño estético
          </label>
        )}
        {showIssues && (
          <fieldset className="stack-label cosmetic-issues">
            <legend>
              Daños estéticos{" "}
              <span className="required-mark">(marca al menos uno)</span>
            </legend>
            <div className="form-checks">
              {COSMETIC_ISSUES.map(([id, label]) => (
                <label key={id} className="checkbox-row">
                  <Checkbox
                    checked={issues.includes(id)}
                    onCheckedChange={(v) =>
                      setIssues((current) =>
                        v ? [...new Set([...current, id])] : current.filter((x) => x !== id),
                      )
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
        )}
        <label className="stack-label">
          Salud de batería (%)
          <Input {...field("battery")} type="number" inputMode="numeric" min="1" max="100" required placeholder="Ej. 96" />
        </label>
        <label className="stack-label">
          Tipo de batería
          <Select value={batteryType} onValueChange={setBatteryType}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="original">Original</SelectItem>
              <SelectItem value="replaced_original">Reemplazada / original</SelectItem>
              <SelectItem value="generic">Genérica / reemplazada</SelectItem>
            </SelectContent>
          </Select>
        </label>
        <label className="stack-label">
          Municipio
          <Select value={location} onValueChange={setLocation} required>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona un municipio" />
            </SelectTrigger>
            <SelectContent>
              {municipalities.map((x) => (
                <SelectItem key={x} value={x}>
                  {x}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      </div>
      <label className="stack-label">
        Barrio (opcional)
        <Input {...field("neighborhood")} maxLength={80} placeholder="Ej. Vedado" />
      </label>
      <div className="form-checks">
        {CHECK_FIELDS.map(([name, label]) => (
          <label key={name} className="checkbox-row">
            <Checkbox
              checked={checks[name]}
              onCheckedChange={(v) => toggleCheck(name, Boolean(v))}
            />
            {label}
          </label>
        ))}
        <label className="checkbox-row">
          <Checkbox checked={warranty} onCheckedChange={(v) => setWarranty(Boolean(v))} />
          Ofrezco garantía
        </label>
      </div>
      {warranty && (
        <label className="stack-label">
          Días de garantía
          <Input {...field("warrantyDays")} type="number" inputMode="numeric" min="1" max="365" required placeholder="Ej. 7" />
        </label>
      )}
      <label className="stack-label">
        Descripción
        <Textarea
          {...field("description")}
          required
          minLength={20}
          maxLength={1500}
          rows={3}
          placeholder="Cuenta cómo has cuidado tu iPhone y qué incluye…"
        />
      </label>
      <label className="stack-label">
        ¿Tiene algún detalle?
        <Textarea
          {...field("details")}
          maxLength={500}
          rows={2}
          placeholder="Describe reparaciones, marcas o fallos, si los tiene."
        />
      </label>
      <label className="checkbox-row terms-check">
        <Checkbox checked={terms} onCheckedChange={(v) => setTerms(Boolean(v))} />
        Confirmo que soy propietario de este iPhone y que los datos son reales.
        No actúo como gestor de ventas.
      </label>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <Button disabled={loading} variant="secondary" className="w-full" type="submit">
        {loading
          ? "Guardando…"
          : live
            ? "Enviar mi anuncio a revisión"
            : "Guardar mi anuncio de prueba"}{" "}
        <span>→</span>
      </Button>
    </form>
  );
}
