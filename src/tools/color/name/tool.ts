export type NamingStyle = "candy" | "brand" | "crayon" | "scientific" | "nature" | "fun" | "all";

export interface NamedColor {
  hex: string;
  name: string;
  style: NamingStyle;
  hashtags: string[];
  facts: string[];
}

const colorNames: Record<string, { name: string; style: NamingStyle }[]> = {
  "#ff0000": [
    { name: "Cherry Red", style: "candy" },
    { name: "Fire Engine", style: "brand" },
    { name: "Scarlet", style: "crayon" },
    { name: "RGB Red", style: "scientific" },
    { name: "Raspberry", style: "nature" },
    { name: "Hot Sauce", style: "fun" },
  ],
  "#00ff00": [
    { name: "Lime Green", style: "candy" },
    { name: "Electric Lime", style: "brand" },
    { name: "Neon Green", style: "crayon" },
    { name: "RGB Green", style: "scientific" },
    { name: "Spring Grass", style: "nature" },
    { name: "Matrix Code", style: "fun" },
  ],
  "#0000ff": [
    { name: "Blue Raspberry", style: "candy" },
    { name: "Sapphire", style: "brand" },
    { name: "Blue", style: "crayon" },
    { name: "RGB Blue", style: "scientific" },
    { name: "Deep Ocean", style: "nature" },
    { name: "Smurf", style: "fun" },
  ],
  "#ffff00": [
    { name: "Lemon Drop", style: "candy" },
    { name: "Golden Yellow", style: "brand" },
    { name: "Canary", style: "crayon" },
    { name: "RGB Yellow", style: "scientific" },
    { name: "Sunflower", style: "nature" },
    { name: "Banana", style: "fun" },
  ],
  "#ff00ff": [
    { name: "Cotton Candy", style: "candy" },
    { name: "Hot Magenta", style: "brand" },
    { name: "Fuchsia", style: "crayon" },
    { name: "RGB Magenta", style: "scientific" },
    { name: "Orchid", style: "nature" },
    { name: "Unicorn", style: "fun" },
  ],
  "#00ffff": [
    { name: "Blue Slushie", style: "candy" },
    { name: "Aqua", style: "brand" },
    { name: "Cyan", style: "crayon" },
    { name: "RGB Cyan", style: "scientific" },
    { name: "Tropical Water", style: "nature" },
    { name: "Mermaid", style: "fun" },
  ],
  "#ffa500": [
    { name: "Orange Creamsicle", style: "candy" },
    { name: "Tangerine", style: "brand" },
    { name: "Orange", style: "crayon" },
    { name: "Orange", style: "scientific" },
    { name: "Sunset", style: "nature" },
    { name: "Cheeto", style: "fun" },
  ],
  "#800080": [
    { name: "Grape Jelly", style: "candy" },
    { name: "Royal Purple", style: "brand" },
    { name: "Purple", style: "crayon" },
    { name: "Purple", style: "scientific" },
    { name: "Lavender", style: "nature" },
    { name: "Grimace", style: "fun" },
  ],
  "#ffc0cb": [
    { name: "Bubblegum", style: "candy" },
    { name: "Millennial Pink", style: "brand" },
    { name: "Pink", style: "crayon" },
    { name: "Pink", style: "scientific" },
    { name: "Cherry Blossom", style: "nature" },
    { name: "Barbie", style: "fun" },
  ],
  "#a52a2a": [
    { name: "Chocolate Fudge", style: "candy" },
    { name: "Espresso", style: "brand" },
    { name: "Brown", style: "crayon" },
    { name: "Brown", style: "scientific" },
    { name: "Tree Bark", style: "nature" },
    { name: "Coffee", style: "fun" },
  ],
  "#ffffff": [
    { name: "Vanilla Bean", style: "candy" },
    { name: "Pure White", style: "brand" },
    { name: "White", style: "crayon" },
    { name: "White", style: "scientific" },
    { name: "Fresh Snow", style: "nature" },
    { name: "Ghost", style: "fun" },
  ],
  "#000000": [
    { name: "Licorice", style: "candy" },
    { name: "Onyx", style: "brand" },
    { name: "Black", style: "crayon" },
    { name: "Black", style: "scientific" },
    { name: "Night Sky", style: "nature" },
    { name: "Void", style: "fun" },
  ],
};

const candyNames = [
  "Cotton Candy", "Bubblegum", "Jelly Bean", "Lollipop", "Gummy Bear",
  "Sour Patch", "Skittle", "M&M", "Smartie", "Nerd", "Runts", "Sweetart",
  "Jawbreaker", "Licorice", "Tootsie Roll", "Milk Dud", "Whopper",
  "Peanut Butter Cup", "Caramel", "Toffee", "Fudge", "Truffle",
];

const brandNames = [
    "Tiffany Blue", "Coca-Cola Red", "Facebook Blue", "Twitter Blue",
    "Instagram Purple", "Spotify Green", "Slack Purple", "Discord Blurple",
    "GitHub Black", "Netflix Red", "Amazon Orange", "Google Blue",
    "Apple Gray", "Microsoft Blue", "Adobe Red", "Figma Purple",
    "Notion Black", "Linear Purple", "Vercel Black", "Railway Purple",
];

const crayonNames = [
  "Red", "Orange", "Yellow", "Green", "Blue", "Purple", "Pink", "Brown",
  "Black", "White", "Gray", "Maroon", "Navy", "Teal", "Olive", "Lime",
  "Aqua", "Fuchsia", "Silver", "Gold", "Bronze", "Copper", "Platinum",
  "Magenta", "Cyan", "Indigo", "Violet", "Turquoise", "Salmon", "Coral",
];

const natureNames = [
  "Ocean", "Sky", "Forest", "Desert", "Mountain", "Sunset", "Sunrise",
  "Flower", "Leaf", "Bark", "Stone", "Sand", "Snow", "Ice", "Fire",
  "Lava", "Ash", "Coal", "Gold", "Silver", "Copper", "Ruby", "Sapphire",
  "Emerald", "Diamond", "Pearl", "Amber", "Jade", "Onyx", "Opal",
];

const funNames = [
  "Unicorn", "Dragon", "Wizard", "Magic", "Sparkle", "Glitter", "Rainbow",
  "Galaxy", "Nebula", "Cosmic", "Retro", "Vaporwave", "Synthwave", "Cyber",
  "Neon", "Glow", "Radiant", "Electric", "Plasma", "Laser", "Hologram",
  "Pixel", "Bit", "Byte", "Code", "Hack", "Glitch", "Matrix",
];

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace(/^#/, "");
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16),
    };
  }
  if (clean.length === 6) {
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16),
    };
  }
  return { r: 0, g: 0, b: 0 };
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const R = r / 255;
  const G = g / 255;
  const B = b / 255;
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  let h = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case R: h = ((G - B) / d) * 60 + (G < B ? 360 : 0); break;
      case G: h = ((B - R) / d) * 60 + 120; break;
      case B: h = ((R - G) / d) * 60 + 240; break;
    }
    if (h < 0) h += 360;
    return { h, s: s * 100, l: l * 100 };
  }
  return { h, s: 0, l: l * 100 };
}

function getDominantHue(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHsl(r, g, b).h;
}

function getLightness(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHsl(r, g, b).l;
}

function getSaturation(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHsl(r, g, b).s;
}

function findClosestNamedColor(hex: string): { name: string; style: NamingStyle } | null {
  const normalized = hex.toLowerCase();
  if (colorNames[normalized] && colorNames[normalized].length > 0) {
    return colorNames[normalized][0];
  }
  return null;
}

function generateNameFromHue(hue: number, style: NamingStyle, lightness: number, saturation: number): string {
  const isLight = lightness > 70;
  const isDark = lightness < 30;
  const isGray = saturation < 15;

  if (isGray) {
    if (isLight) return style === "candy" ? "Marshmallow" : style === "brand" ? "Cloud" : style === "crayon" ? "Light Gray" : style === "scientific" ? "Light Gray" : style === "nature" ? "Morning Mist" : "Ghost";
    if (isDark) return style === "candy" ? "Dark Chocolate" : style === "brand" ? "Onyx" : style === "crayon" ? "Dark Gray" : style === "scientific" ? "Dark Gray" : style === "nature" ? "Storm Cloud" : "Shadow";
    return style === "candy" ? "Rock Candy" : style === "brand" ? "Silver" : style === "crayon" ? "Gray" : style === "scientific" ? "Gray" : style === "nature" ? "Pebble" : "Robot";
  }

  const hueNames: Record<number, { [key in NamingStyle]?: string }> = {
    0: { candy: "Cherry", brand: "Fire", crayon: "Red", scientific: "Red", nature: "Rose", fun: "Dragon" },
    30: { candy: "Orange Creamsicle", brand: "Tangerine", crayon: "Orange", scientific: "Orange", nature: "Tiger Lily", fun: "Cheeto" },
    60: { candy: "Lemon Drop", brand: "Gold", crayon: "Yellow", scientific: "Yellow", nature: "Sunflower", fun: "Banana" },
    120: { candy: "Green Apple", brand: "Emerald", crayon: "Green", scientific: "Green", nature: "Forest", fun: "Matrix" },
    180: { candy: "Mint", brand: "Teal", crayon: "Teal", scientific: "Cyan", nature: "Ocean", fun: "Mermaid" },
    240: { candy: "Blue Raspberry", brand: "Sapphire", crayon: "Blue", scientific: "Blue", nature: "Deep Sea", fun: "Smurf" },
    270: { candy: "Grape", brand: "Royal", crayon: "Purple", scientific: "Purple", nature: "Lavender", fun: "Wizard" },
    300: { candy: "Cotton Candy", brand: "Magenta", crayon: "Pink", scientific: "Magenta", nature: "Orchid", fun: "Unicorn" },
  };

  let closestHue = 0;
  let minDiff = 360;
  Object.keys(hueNames).forEach(key => {
    const h = parseInt(key, 10);
    const diff = Math.abs(hue - h);
    const circularDiff = Math.min(diff, 360 - diff);
    if (circularDiff < minDiff) {
      minDiff = circularDiff;
      closestHue = h;
    }
  });

  const baseName = hueNames[closestHue]?.[style] || hueNames[closestHue]?.candy || "Color";

  if (isLight) return baseName + " (Pastel)";
  if (isDark) return "Dark " + baseName;
  return baseName;
}

function generateHashtags(name: string, hex: string, style: NamingStyle): string[] {
  const cleanName = name.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const hexClean = hex.replace("#", "");
  return [
    `#${cleanName}`,
    `#${hexClean}`,
    `#${style}color`,
    `#colorname`,
    `#hexcolor`,
    `#design`,
    `#palette`,
  ];
}

function generateFacts(hex: string, _name: string): string[] {
  const { r, g, b } = hexToRgb(hex);
  const hsl = rgbToHsl(r, g, b);
  const facts: string[] = [];

  facts.push(`RGB: (${r}, ${g}, ${b})`);
  facts.push(`HSL: ${Math.round(hsl.h)}°, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%`);
  facts.push(`Closest web-safe: ${getWebSafe(hex)}`);

  if (hsl.l > 80) facts.push("Very light - good for backgrounds");
  else if (hsl.l < 20) facts.push("Very dark - good for text");
  else facts.push("Medium lightness - versatile for UI");

  if (hsl.s < 15) facts.push("Near-neutral gray tone");
  else if (hsl.s > 80) facts.push("Highly saturated - vibrant and bold");

  const isWebSafe = [r, g, b].every(c => c % 51 === 0);
  if (isWebSafe) facts.push("This is a traditional web-safe color!");

  return facts;
}

function getWebSafe(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const snap = (v: number) => Math.round(v / 51) * 51;
  return `#${[snap(r), snap(g), snap(b)].map(x => x.toString(16).padStart(2, "0")).join("")}`;
}

export function nameColor(hex: string, style: NamingStyle = "all"): NamedColor {
  const normalized = hex.toLowerCase().replace(/^#/, "");
  const fullHex = "#" + normalized.padStart(6, "0").slice(-6);

  const existing = findClosestNamedColor(fullHex);
  const hue = getDominantHue(fullHex);
  const lightness = getLightness(fullHex);
  const saturation = getSaturation(fullHex);

  let finalName: string;
  let finalStyle: NamingStyle = style;

  if (existing && (style === "all" || style === existing.style)) {
    finalName = existing.name;
    finalStyle = existing.style;
  } else if (style === "all") {
    const styles: NamingStyle[] = ["candy", "brand", "crayon", "scientific", "nature", "fun"];
    finalStyle = styles[Math.floor(Math.random() * styles.length)];
    finalName = generateNameFromHue(hue, finalStyle, lightness, saturation);
  } else {
    finalName = generateNameFromHue(hue, style, lightness, saturation);
  }

  const hashtags = generateHashtags(finalName, fullHex, finalStyle);
  const facts = generateFacts(fullHex, finalName);

  return {
    hex: fullHex,
    name: finalName,
    style: finalStyle,
    hashtags,
    facts,
  };
}

export function nameColorAllStyles(hex: string): NamedColor[] {
  const styles: NamingStyle[] = ["candy", "brand", "crayon", "scientific", "nature", "fun"];
  return styles.map(style => nameColor(hex, style));
}

export function generateColorName(hex: string, style: NamingStyle): string {
  const hue = getDominantHue(hex);
  const lightness = getLightness(hex);
  const saturation = getSaturation(hex);
  return generateNameFromHue(hue, style, lightness, saturation);
}

export function getRandomColorName(style: NamingStyle): string {
  const names = style === "candy" ? candyNames : style === "brand" ? brandNames : style === "crayon" ? crayonNames : style === "nature" ? natureNames : funNames;
  return names[Math.floor(Math.random() * names.length)];
}