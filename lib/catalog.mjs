export const municipalities = [
  "Plaza de la Revolución",
  "Playa",
  "Centro Habana",
  "Habana Vieja",
  "Cerro",
  "Diez de Octubre",
  "Boyeros",
  "Arroyo Naranjo",
  "Marianao",
  "La Lisa",
  "Guanabacoa",
  "Regla",
  "Habana del Este",
  "San Miguel del Padrón",
  "Cotorro",
];
export const demoListings = [
  {
    id: "demo-1",
    model: "iPhone 16 Pro",
    storage: 256,
    color: "Titanio natural",
    price: 890,
    battery: 100,
    condition: "Como nuevo",
    location: "Plaza de la Revolución",
    image: "/images/iphone-natural.webp",
    seller: "Alejandro R.",
    initials: "AR",
    avatar: "#eadfd0",
    rating: 4.9,
    sales: 8,
    joined: "marzo de 2024",
    hours: 2,
    verified: true,
    originalBattery: true,
    factoryUnlocked: true,
    faceId: true,
    trueTone: true,
    warrantyDays: 7,
    accessories: true,
    featured: true,
    description:
      "Muy bien cuidado, sin golpes ni rayones. Todas sus funciones están perfectas. Incluye su caja y cable original. Puedes revisarlo con calma antes de comprar.",
  },
  {
    id: "demo-2",
    model: "iPhone 15",
    storage: 128,
    color: "Verde",
    price: 540,
    battery: 96,
    condition: "Excelente",
    location: "Playa",
    image: "/images/iphone-green.webp",
    seller: "Claudia M.",
    initials: "CM",
    avatar: "#dfdfec",
    rating: 5.0,
    sales: 3,
    joined: "junio de 2024",
    hours: 4,
    verified: true,
    originalBattery: true,
    factoryUnlocked: true,
    faceId: true,
    trueTone: true,
    warrantyDays: 3,
    accessories: true,
    description:
      "Mi iPhone personal, siempre usado con funda y protector. Batería original al 96 %. Lo vendo porque cambié de modelo.",
  },
  {
    id: "demo-3",
    model: "iPhone 16 Pro Max",
    storage: 256,
    color: "Titanio desierto",
    price: 1050,
    battery: 100,
    condition: "Como nuevo",
    location: "Centro Habana",
    image: "/images/iphone-desert.webp",
    seller: "Daniel G.",
    initials: "DG",
    avatar: "#d8e6e0",
    rating: 4.8,
    sales: 12,
    joined: "enero de 2024",
    hours: 5,
    verified: true,
    originalBattery: true,
    factoryUnlocked: true,
    faceId: true,
    trueTone: true,
    warrantyDays: 15,
    accessories: true,
    featured: true,
    description:
      "Excelente estado, muy poco uso. Pantalla impecable, batería original y todos sus accesorios. Soy el único propietario.",
  },
  {
    id: "demo-4",
    model: "iPhone 15",
    storage: 256,
    color: "Azul",
    price: 580,
    battery: 92,
    condition: "Excelente",
    location: "Habana Vieja",
    image: "/images/iphone-blue.webp",
    seller: "Marcos P.",
    initials: "MP",
    avatar: "#e3e7ef",
    rating: 4.9,
    sales: 5,
    joined: "abril de 2024",
    hours: 8,
    verified: true,
    originalBattery: true,
    factoryUnlocked: true,
    faceId: true,
    trueTone: true,
    warrantyDays: 7,
    accessories: false,
    description:
      "Funciona perfectamente. Tiene una pequeña marca en el borde, visible en persona. Precio negociable.",
  },
  {
    id: "demo-5",
    model: "iPhone 16 Pro",
    storage: 128,
    color: "Titanio negro",
    price: 790,
    battery: 97,
    condition: "Excelente",
    location: "Playa",
    image: "/images/iphone-black.webp",
    seller: "Javier L.",
    initials: "JL",
    avatar: "#ece2d9",
    rating: 5.0,
    sales: 2,
    joined: "agosto de 2024",
    hours: 12,
    verified: true,
    originalBattery: true,
    factoryUnlocked: true,
    faceId: true,
    trueTone: true,
    warrantyDays: 0,
    accessories: true,
    description:
      "Libre de fábrica y sin reparaciones. El teléfono está en excelente estado. Puedes comprobar todas las funciones al recogerlo.",
  },
  {
    id: "demo-6",
    model: "iPhone 15",
    storage: 128,
    color: "Rosa",
    price: 520,
    battery: 90,
    condition: "Buen estado con detalles",
    location: "Diez de Octubre",
    image: "/images/iphone-pink.webp",
    seller: "Gabriela S.",
    initials: "GS",
    avatar: "#f0dfe5",
    rating: 4.9,
    sales: 6,
    joined: "febrero de 2024",
    hours: 18,
    verified: true,
    originalBattery: true,
    factoryUnlocked: true,
    faceId: true,
    trueTone: true,
    warrantyDays: 5,
    accessories: true,
    description:
      "iPhone rosa con detalles normales de uso en el marco. Pantalla sin rayones. Incluye cargador y funda transparente.",
  },
];
export const money = (value) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
// Antigüedad de un anuncio a partir de las horas transcurridas.
// Menos de 1 h: "Ahora"; menos de 24 h: horas; después: días; 30+ días: meses.
export function timeAgo(hours, { long = false } = {}) {
  const h = Math.max(0, Math.floor(Number(hours) || 0));
  const prefix = long ? "Publicado hace" : "Hace";
  if (h < 1) return long ? "Publicado ahora" : "Ahora";
  if (h < 24) return `${prefix} ${h} ${long ? (h === 1 ? "hora" : "horas") : "h"}`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${prefix} ${days} ${long ? (days === 1 ? "día" : "días") : days === 1 ? "día" : "d"}`;
  const months = Math.floor(days / 30);
  return `${prefix} ${months} ${months === 1 ? "mes" : "meses"}`;
}
export function filterListings(listings, filters) {
  const result = listings.filter((item) => {
    const search =
      `${item.model} ${item.color} ${item.storage} ${item.location}`.toLocaleLowerCase(
        "es",
      );
    return (
      !item.sold &&
      (!filters.query ||
        search.includes(filters.query.toLocaleLowerCase("es"))) &&
      (!filters.models?.length ||
        filters.models.some(
          (model) =>
            item.model === model ||
            item.model.startsWith(model + " ") ||
            (model === "iPhone X" && /^iPhone X[SR]/.test(item.model)),
        )) &&
      (!filters.storage?.length || filters.storage.includes(item.storage)) &&
      (!filters.conditions?.length ||
        filters.conditions.includes(item.condition)) &&
      item.price >= (filters.minPrice || 0) &&
      item.price <= (filters.maxPrice || Infinity) &&
      item.battery >= (filters.minBattery || 0) &&
      (!filters.location || item.location === filters.location) &&
      (!filters.verified || item.verified) &&
      (!filters.warranty || item.warrantyDays > 0) &&
      (!filters.favoritesOnly || filters.favorites?.includes(item.id))
    );
  });
  return result.sort((a, b) =>
    filters.sort === "price-asc"
      ? a.price - b.price
      : filters.sort === "price-desc"
        ? b.price - a.price
        : filters.sort === "battery"
          ? b.battery - a.battery
          : a.hours - b.hours,
  );
}
export const defaultFilters = {
  query: "",
  models: [],
  storage: [],
  conditions: [],
  minPrice: "",
  maxPrice: "",
  minBattery: 0,
  location: "",
  verified: false,
  warranty: false,
  sort: "recent",
  favoritesOnly: false,
};

export const COSMETIC_ISSUES = [
  ["back_glass", "Cristal trasero dañado"],
  ["front_glass", "Cristal delantero dañado"],
  ["screen_stain", "Mancha en pantalla"],
  ["screen_scratches", "Rayas en pantalla"],
  ["frame_dents", "Marco golpeado"],
];
export const cosmeticLabel = (key) =>
  COSMETIC_ISSUES.find(([id]) => id === key)?.[1] || key;

// Condición estética: etiqueta visible y valor del enum en la base de datos.
export const CONDITIONS = [
  "Como nuevo",
  "Excelente",
  "Buen estado con detalles",
  "Funcional con detalles",
];
export const conditionNeedsIssues = (condition) =>
  condition === "Buen estado con detalles" ||
  condition === "Funcional con detalles";
