export type ColorFormat = "hex" | "rgb" | "hsl" | "lab" | "oklch";

export interface Color {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  lab: { l: number; a: number; b: number };
  oklch: { l: number; c: number; h: number };
  name: string;
}

export interface Harmony {
  name: string;
  colors: Color[];
}

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
      case R:
        h = ((G - B) / d) * 60 + (G < B ? 360 : 0);
        break;
      case G:
        h = ((B - R) / d) * 60 + 120;
        break;
      case B:
        h = ((R - G) / d) * 60 + 240;
        break;
    }
    if (h < 0) h += 360;
    return { h, s: s * 100, l: l * 100 };
  }
  return { h, s: 0, l: l * 100 };
}

function rgbToLab(r: number, g: number, b: number): { l: number; a: number; b: number } {
  const [R, G, B] = [r / 255, g / 255, b / 255];
  const corrected = (c: number): number => {
    return c > 0.04045 ? Math.pow((c + 0.055) / 1.055, 2.4) : c / 12.92;
  };
  const [cr, cg, cb] = [corrected(R), corrected(G), corrected(B)];
  const [xr, xg, xb] = [cr * 0.4124, cg * 0.3576, cb * 0.1805];
  const [yr, yg, yb] = [cr * 0.2126, cg * 0.7152, cb * 0.0722];
  const [zr, zg, zb] = [cr * 0.0193, cg * 0.1192, cb * 0.9505];
  const fx = xr * 0.4124 + xg * 0.3576 + xb * 0.1805;
  const fy = yr * 0.2126 + yg * 0.7152 + yb * 0.0722;
  const fz = zr * 0.0193 + zg * 0.1192 + zb * 0.9505;
  const fxp = Math.cbrt(fx);
  const fyp = Math.cbrt(fy);
  const fzp = Math.cbrt(fz);
  const la = (116 * fyp - 16) / 100;
  const aa = 500 * (fxp - fyp);
  const bb = 200 * (fyp - fzp);
  return { l: Math.max(0, Math.min(100, la)), a: Math.max(-128, Math.min(128, aa)), b: Math.max(-128, Math.min(128, bb)) };
}

function rgbToOklch(r: number, g: number, b: number): { l: number; c: number; h: number } {
  const [R, G, B] = [r / 255, g / 255, b / 255];
  const adjust = (c: number): number => c > 0.04045 ? Math.pow((c + 0.055) / 1.055, 2.4) : c / 12.92;
  const [ra, ga, ba] = [adjust(R), adjust(G), adjust(B)];
  const l = 0.4122214708 * ra + 0.5363325663 * ga + 0.0514459929 * ba;
  const m = 0.2119034982 * ra + 0.6806595453 * ga + 0.1074369566 * ba;
  const s = 0.0883024619 * ra + 0.2818485177 * ga + 0.8883050293 * ba;
  const ll = 0.2103 * Math.cbrt(l);
  const mm = 0.5962 * Math.cbrt(m);
  const ss = 0.1902 * Math.cbrt(s);
  const luminance = ll + mm + ss;
  const aa = ll - mm;
  const bb = ll - ss;
  const chroma = Math.sqrt(aa * aa + bb * bb);
  const hue = Math.atan2(bb, aa);
  return {
    l: Math.max(0, Math.min(1, luminance)) * 100,
    c: Math.max(0, Math.min(150, chroma * 150)),
    h: (hue * 180 / Math.PI + 360) % 360,
  };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const C = (1 - Math.abs(2 * l / 100 - 1)) * (s / 100);
  const X = C * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l / 100 - C / 2;
  let r: number = 0, g: number = 0, b: number = 0;
  if (0 <= h && h < 60) [r, g, b] = [C, X, 0];
  else if (60 <= h && h < 120) [r, g, b] = [X, C, 0];
  else if (120 <= h && h < 180) [r, g, b] = [0, C, X];
  else if (180 <= h && h < 240) [r, g, b] = [0, X, C];
  else if (240 <= h && h < 300) [r, g, b] = [X, 0, C];
  else [r, g, b] = [C, 0, X];
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);
  return { r, g, b };
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, "0")).join("")}`;
}

function generateAnalogous(baseHsl: { h: number; s: number; l: number }, count = 5): { h: number; s: number; l: number }[] {
  const colors: { h: number; s: number; l: number }[] = [];
  const step = 30;
  for (let i = -2; i <= 2; i++) {
    const h = ((baseHsl.h + i * step) % 360 + 360) % 360;
    colors.push({ h, s: baseHsl.s, l: baseHsl.l });
  }
  return colors.slice(0, count);
}

function generateComplementary(baseHsl: { h: number; s: number; l: number }, count = 2): { h: number; s: number; l: number }[] {
  return [
    { h: baseHsl.h, s: baseHsl.s, l: baseHsl.l },
    { h: (baseHsl.h + 180) % 360, s: baseHsl.s, l: baseHsl.l },
  ].slice(0, count);
}

function generateTriadic(baseHsl: { h: number; s: number; l: number }, _count = 3): { h: number; s: number; l: number }[] {
  return [
    { h: baseHsl.h, s: baseHsl.s, l: baseHsl.l },
    { h: (baseHsl.h + 120) % 360, s: baseHsl.s, l: baseHsl.l },
    { h: (baseHsl.h + 240) % 360, s: baseHsl.s, l: baseHsl.l },
  ];
}

function generateTetradic(baseHsl: { h: number; s: number; l: number }, _count = 4): { h: number; s: number; l: number }[] {
  return [
    { h: baseHsl.h, s: baseHsl.s, l: baseHsl.l },
    { h: (baseHsl.h + 90) % 360, s: baseHsl.s, l: baseHsl.l },
    { h: (baseHsl.h + 180) % 360, s: baseHsl.s, l: baseHsl.l },
    { h: (baseHsl.h + 270) % 360, s: baseHsl.s, l: baseHsl.l },
  ];
}

function hexToName(hex: string): string {
  const normalized = hex.toLowerCase().replace(/^#/, "");
  const namedColors: Record<string, string> = {
    "000000": "Black",
    "ffffff": "White",
    "ff0000": "Red",
    "00ff00": "Lime",
    "0000ff": "Blue",
    "ffff00": "Yellow",
    "00ffff": "Cyan",
    "ff00ff": "Magenta",
    "c0c0c0": "Silver",
    "808080": "Gray",
    "800000": "Maroon",
    "800080": "Purple",
    "008000": "Green",
    "008080": "Teal",
    "000080": "Navy",
    "ffa500": "Orange",
    "ffd700": "Gold",
    "ff1493": "DeepPink",
    "7fff00": "Chartreuse",
    "87ceeb": "SkyBlue",
    "da70d6": "Orchid",
    "fa8072": "Salmon",
  };
  return namedColors[normalized] || "Custom Color";
}

export function parseColor(colorInput: string): Color {
  let hex = colorInput.trim();
  if (!hex.startsWith("#")) hex = "#" + hex;
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const lab = rgbToLab(rgb.r, rgb.g, rgb.b);
  const oklch = rgbToOklch(rgb.r, rgb.g, rgb.b);
  return {
    hex,
    rgb,
    hsl,
    lab,
    oklch,
    name: hexToName(hex),
  };
}

export function generateHarmonies(baseColor: Color, types: string[] = ["analogous", "complementary", "triadic", "tetradic"]): Harmony[] {
  const baseHsl = baseColor.hsl;
  const harmonies: Harmony[] = [];
  const allColors: Color[] = [];

  if (types.includes("analogous")) {
    const colors = generateAnalogous(baseHsl, 5);
    const harmonyColors = colors.map(c => {
      const rgb = hslToRgb(c.h, c.s, c.l);
      return parseColor(rgbToHex(rgb.r, rgb.g, rgb.b));
    });
    harmonies.push({ name: "Analogous", colors: harmonyColors });
    allColors.push(...harmonyColors);
  }

  if (types.includes("complementary")) {
    const colors = generateComplementary(baseHsl, 2);
    const harmonyColors = colors.map(c => {
      const rgb = hslToRgb(c.h, c.s, c.l);
      return parseColor(rgbToHex(rgb.r, rgb.g, rgb.b));
    });
    harmonies.push({ name: "Complementary", colors: harmonyColors });
    allColors.push(...harmonyColors);
  }

  if (types.includes("triadic")) {
    const colors = generateTriadic(baseHsl, 3);
    const harmonyColors = colors.map(c => {
      const rgb = hslToRgb(c.h, c.s, c.l);
      return parseColor(rgbToHex(rgb.r, rgb.g, rgb.b));
    });
    harmonies.push({ name: "Triadic", colors: harmonyColors });
    allColors.push(...harmonyColors);
  }

  if (types.includes("tetradic")) {
    const colors = generateTetradic(baseHsl, 4);
    const harmonyColors = colors.map(c => {
      const rgb = hslToRgb(c.h, c.s, c.l);
      return parseColor(rgbToHex(rgb.r, rgb.g, rgb.b));
    });
    harmonies.push({ name: "Tetradic", colors: harmonyColors });
    allColors.push(...harmonyColors);
  }

  return harmonies;
}

export function getRandomColor(): Color {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return parseColor(rgbToHex(r, g, b));
}

export function colorDistance(c1: Color, c2: Color): number {
  const lab1 = c1.lab;
  const lab2 = c2.lab;
  return Math.sqrt(Math.pow(lab2.l - lab1.l, 2) + Math.pow(lab2.a - lab1.a, 2) + Math.pow(lab2.b - lab1.b, 2));
}

export function findSimilarColors(color: Color, allColors: Color[], maxDistance = 20): Color[] {
  return allColors.filter(c => c.hex !== color.hex && colorDistance(color, c) < maxDistance);
}

export function generateColorPaletteFromImage(
  imageData: ImageData | null,
  _harmonyTypes: string[] = ["analogous", "complementary", "triadic", "tetradic"]
): { [key: string]: ReturnType<typeof generateColorPalette> } {
  if (!imageData) return {};
  const colorMap = new Map<string, number>();
  for (let i = 0; i < imageData.data.length; i += 4) {
    const [r, g, b] = [imageData.data[i], imageData.data[i + 1], imageData.data[i + 2]];
    const hex = rgbToHex(r, g, b);
    colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
  }
  const topColors = Array.from(colorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([hex]) => parseColor(hex));
  const result: { [key: string]: ReturnType<typeof generateColorPalette> } = {};
  topColors.forEach((color, idx) => {
    const palette = generateColorPalette(color.hex, { analogous: true, complementary: true, triadic: true, tetradic: true });
    result[`palette-${idx + 1}`] = palette;
  });
  return result;
}

export function generateColorPalette(
  baseHex: string,
  options: {
    analogous?: boolean;
    complementary?: boolean;
    triadic?: boolean;
    tetradic?: boolean;
  } = {}
): {
  base: Color;
  harmonies: {
    analogous: Color[];
    complementary: Color[];
    triadic: Color[];
    tetradic: Color[];
  };
} {
  const baseColor = parseColor(baseHex);
  const result: ReturnType<typeof generateColorPalette> = {
    base: baseColor,
    harmonies: {
      analogous: [],
      complementary: [],
      triadic: [],
      tetradic: [],
    },
  };

  if (options.analogous) {
    const colors = generateAnalogous(baseColor.hsl, 5);
    result.harmonies.analogous = colors.map(c => parseColor(rgbToHex(hslToRgb(c.h, c.s, c.l).r, hslToRgb(c.h, c.s, c.l).g, hslToRgb(c.h, c.s, c.l).b)));
  }
  if (options.complementary) {
    const colors = generateComplementary(baseColor.hsl, 2);
    result.harmonies.complementary = colors.map(c => parseColor(rgbToHex(hslToRgb(c.h, c.s, c.l).r, hslToRgb(c.h, c.s, c.l).g, hslToRgb(c.h, c.s, c.l).b)));
  }
  if (options.triadic) {
    const colors = generateTriadic(baseColor.hsl, 3);
    result.harmonies.triadic = colors.map(c => parseColor(rgbToHex(hslToRgb(c.h, c.s, c.l).r, hslToRgb(c.h, c.s, c.l).g, hslToRgb(c.h, c.s, c.l).b)));
  }
  if (options.tetradic) {
    const colors = generateTetradic(baseColor.hsl, 4);
    result.harmonies.tetradic = colors.map(c => parseColor(rgbToHex(hslToRgb(c.h, c.s, c.l).r, hslToRgb(c.h, c.s, c.l).g, hslToRgb(c.h, c.s, c.l).b)));
  }
  return result;
}