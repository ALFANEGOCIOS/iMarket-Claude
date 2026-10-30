// Colores de fábrica por modelo, según Apple (especificaciones técnicas y Newsroom)
// y la guía de colores de MacRumors. Nombres en español.
const RED = "(PRODUCT)RED";
const SG = "Gris espacial", SILVER = "Plata", GOLD = "Oro", ROSE = "Oro rosa";
const BLACK = "Negro", WHITE = "Blanco";

export const IPHONE_COLORS = {
  "iPhone 18 Pro Max": ["Negro", "Plata", "Glaciar", "Borgoña"],
  "iPhone 18 Pro": ["Negro", "Plata", "Glaciar", "Borgoña"],
  "iPhone Duo": ["Blanco estrella", "Cielo nocturno"],
  "iPhone 17 Pro Max": [SILVER, "Naranja cósmico", "Azul profundo"],
  "iPhone 17 Pro": [SILVER, "Naranja cósmico", "Azul profundo"],
  "iPhone 17 Air": ["Negro espacial", "Blanco nube", "Oro claro", "Azul cielo"],
  "iPhone 17": [BLACK, WHITE, "Azul niebla", "Salvia", "Lavanda"],
  "iPhone 17e": [BLACK, WHITE, "Rosa suave"],
  "iPhone 16 Pro Max": ["Titanio negro", "Titanio blanco", "Titanio natural", "Titanio desierto"],
  "iPhone 16 Pro": ["Titanio negro", "Titanio blanco", "Titanio natural", "Titanio desierto"],
  "iPhone 16 Plus": [BLACK, WHITE, "Rosa", "Verde azulado", "Ultramar"],
  "iPhone 16": [BLACK, WHITE, "Rosa", "Verde azulado", "Ultramar"],
  "iPhone 16e": [BLACK, WHITE],
  "iPhone 15 Pro Max": ["Titanio negro", "Titanio blanco", "Titanio azul", "Titanio natural"],
  "iPhone 15 Pro": ["Titanio negro", "Titanio blanco", "Titanio azul", "Titanio natural"],
  "iPhone 15 Plus": [BLACK, "Azul", "Verde", "Amarillo", "Rosa"],
  "iPhone 15": [BLACK, "Azul", "Verde", "Amarillo", "Rosa"],
  "iPhone 14 Pro Max": ["Negro espacial", SILVER, GOLD, "Morado oscuro"],
  "iPhone 14 Pro": ["Negro espacial", SILVER, GOLD, "Morado oscuro"],
  "iPhone 14 Plus": ["Medianoche", "Blanco estelar", "Azul", "Morado", "Amarillo", RED],
  "iPhone 14": ["Medianoche", "Blanco estelar", "Azul", "Morado", "Amarillo", RED],
  "iPhone 13 Pro Max": ["Grafito", GOLD, SILVER, "Azul sierra", "Verde alpino"],
  "iPhone 13 Pro": ["Grafito", GOLD, SILVER, "Azul sierra", "Verde alpino"],
  "iPhone 13": ["Medianoche", "Blanco estelar", "Rosa", "Azul", "Verde", RED],
  "iPhone 13 mini": ["Medianoche", "Blanco estelar", "Rosa", "Azul", "Verde", RED],
  "iPhone 12 Pro Max": ["Grafito", SILVER, GOLD, "Azul pacífico"],
  "iPhone 12 Pro": ["Grafito", SILVER, GOLD, "Azul pacífico"],
  "iPhone 12": [BLACK, WHITE, RED, "Verde", "Azul", "Morado"],
  "iPhone 12 mini": [BLACK, WHITE, RED, "Verde", "Azul", "Morado"],
  // SE: se unifican las 3 generaciones (2016, 2020 y 2022).
  "iPhone SE": [SG, SILVER, GOLD, ROSE, BLACK, WHITE, "Medianoche", "Blanco estelar", RED],
  "iPhone 11 Pro Max": [SG, SILVER, GOLD, "Verde noche"],
  "iPhone 11 Pro": [SG, SILVER, GOLD, "Verde noche"],
  "iPhone 11": [BLACK, WHITE, "Verde", "Amarillo", "Morado", RED],
  "iPhone XS Max": [SG, SILVER, GOLD],
  "iPhone XS": [SG, SILVER, GOLD],
  "iPhone XR": [BLACK, WHITE, "Azul", "Amarillo", "Coral", RED],
  "iPhone X": [SG, SILVER],
  "iPhone 8 Plus": [SG, SILVER, GOLD, RED],
  "iPhone 8": [SG, SILVER, GOLD, RED],
  "iPhone 7 Plus": ["Negro brillante", BLACK, SILVER, GOLD, ROSE, RED],
  "iPhone 7": ["Negro brillante", BLACK, SILVER, GOLD, ROSE, RED],
  "iPhone 6s Plus": [SG, SILVER, GOLD, ROSE],
  "iPhone 6s": [SG, SILVER, GOLD, ROSE],
  "iPhone 6 Plus": [SG, SILVER, GOLD],
  "iPhone 6": [SG, SILVER, GOLD],
};

export const colorsFor = (model) => IPHONE_COLORS[model] || [];
