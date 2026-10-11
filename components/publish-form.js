"use client";
import { useState } from "react";
import { Camera, Check, LoaderCircle, X, ShieldCheck } from "lucide-react";
import { municipalities } from "../lib/catalog.mjs";
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
const STORAGE_OPTIONS = [16, 32, 64, 128, 256, 512, 1024];
const CONDITIONS = ["Como nuevo", "Excelente", "Buen estado"];
const CHECK_FIELDS = [
  ["factoryUnlocked", "Libre de fábrica"],
  ["faceId", "Face ID funciona"],
  ["trueTone", "True Tone funciona"],
  ["includesCable", "Incluye cable"],
  ["includesCharger", "Incluye cargador"],
  ["negotiable", "Precio negociable"],
  ["acceptsTrade", "Acepto intercambio"],
];

export default function PublishForm({ onPublish, user, live = false }) {
  const [photos, setPhotos] = useState([]);
  const [listingId] = useState(() => crypto.randomUUID());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [warranty, setWarranty] = useState(false);
  const [step, setStep] = useState(1);
  const [model, setModel] = useState("");
  const [storage, setStorage] = useState("128");
  const [condition, setCondition] = useState(CONDITIONS[1]);
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
    if (!terms) {
      setError("Debes confirmar que eres el propietario del iPhone.");
      return;
    }
    const data = Object.fromEntries(new FormData(event.currentTarget));
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
        location,
        color: data.color,
        description: data.description,
        details: data.details,
        factoryUnlocked: checks.factoryUnlocked,
        faceId: checks.faceId,
        trueTone: checks.trueTone,
        originalBattery: batteryType === "original",
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
          <Select value={model} onValueChange={setModel} required>
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
          <Select value={storage} onValueChange={setStorage}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STORAGE_OPTIONS.map((x) => (
                <SelectItem key={x} value={String(x)}>
                  {x === 1024 ? "1 TB" : `${x} GB`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="stack-label">
          Precio (USD)
          <Input name="price" type="number" required min="1" max="10000" placeholder="Ej. 550" />
        </label>
        <label className="stack-label">
          Color
          <Input required name="color" maxLength={40} placeholder="Ej. Titanio natural" />
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
        <label className="stack-label">
          Salud de batería (%)
          <Input name="battery" type="number" min="1" max="100" required placeholder="Ej. 96" />
        </label>
        <label className="stack-label">
          Tipo de batería
          <Select value={batteryType} onValueChange={setBatteryType}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="original">Original</SelectItem>
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
        <Input name="neighborhood" maxLength={80} placeholder="Ej. Vedado" />
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
          <Input type="number" name="warrantyDays" min="1" max="365" required placeholder="Ej. 7" />
        </label>
      )}
      <label className="stack-label">
        Descripción
        <Textarea
          name="description"
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
          name="details"
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
