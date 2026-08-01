export type ColorFormat = "hex" | "rgb" | "hsl" | "oklch";

export interface Color {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  oklch: { l: number; c: number; h: number };
  name: string;
}

export interface Palette {
  base: Color;
  harmonious: {
    analogous: Color[];
    complementary: Color[];
    triadic: Color[];
    tetradic: Color[];
  };
  monochromatic: Color[];
  shuffled: Color[];
  locked: boolean;
}

export interface HarmonyType {
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
  throw new Error("Invalid hex color");
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const R = r / 255;
  const G = g / 255;
  const B = b / 255;
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case R:
        h = (G - B) / d + (G < B ? 2 : 0);
        break;
      case G:
        h = (B - R) / d + (B < R ? 2 : 0);
        break;
      case B:
        h = (R - G) / d + (R < G ? 2 : 0);
        break;
    }
    h *= 60;
  }
  return { h: h % 360, s: s * 100, l: l * 100 };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const C = (1 - Math.abs(2 * l / 100 - 1)) * (s / 100);
  const X = C * (1 - Math.abs(((h / 60) % 2) - 1));
  let m = 0;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = C; g = X; b = 0; }
  else if (h < 120) { r = X; g = C; b = 0; }
  else if (h < 180) { r = 0; g = C; b = X; }
  else if (h < 240) { r = 0; g = X; b = C; }
  else if (h < 300) { r = X; g = 0; b = C; }
  else { r = C; g = 0; b = X; }
  const _m = m;
  const _r = (r + _m) * 255;
  const _g = (g + _m) * 255;
  const _b = (b + _m) * 255;
  return {
    r: Math.round(_r),
    g: Math.round(_g),
    b: Math.round(_b),
  };
}

function rgbToHslDirect(r: number, g: number, b: number): { h: number; s: number; l: number } {
  return rgbToHsl(r, g, b);
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, "0")).join("")}`;
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHsl(r, g, b);
}

function lockColors(colors: Color[]): Color[] {
  return colors.map((c, i) => ({
    ...c,
    hex: c.hex,
  }));
}

function shuffleColors(colors: Color[]): Color[] {
  const arr = [...colors];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateAnalogous(baseHsl: { h: number; s: number; l: number }, count = 5): { h: number; s: number; l: number }[] {
  const colors = [];
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

function generateTriadic(baseHsl: { h: number; s: number; l: number }, count = 3): { h: number; s: number; l: number }[] {
  return [
    { h: baseHsl.h, s: baseHsl.s, l: baseHsl.l },
    { h: (baseHsl.h + 120) % 360, s: baseHsl.s, l: baseHsl.l },
    { h: (baseHsl.h + 240) % 360, s: baseHsl.s, l: baseHsl.l },
  ];
}

function generateTetradic(baseHsl: { h: number; s: number; l: number }, count = 4): { h: number; s: number; l: number }[] {
  return [
    { h: baseHsl.h, s: baseHsl.s, l: baseHsl.l },
    { h: (baseHsl.h + 90) % 360, s: baseHsl.s, l: baseHsl.l },
    { h: (baseHsl.h + 180) % 360, s: baseHsl.s, l: baseHsl.l },
    { h: (baseHsl.h + 270) % 360, s: baseHsl.s, l: baseHsl.l },
  ];
}

function generateMonochromatic(baseHsl: { h: number; s: number; l: number }, count = 5): { h: number; s: number; l: number }[] {
  const colors = [];
  const lMin = Math.max(20, baseHsl.l - 40);
  const lMax = Math.min(80, baseHsl.l + 40);
  for (let i = 0; i < count; i++) {
    const l = lMin + ((lMax - lMin) * i) / (count - 1);
    colors.push({ h: baseHsl.h, s: baseHsl.s, l });
  }
  return colors;
}

function hslToHex(h: number, s: number, l: number): string {
  const { r, g, b } = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
}

function generateColorPalette(
  baseHex: string,
  options: {
    analogous?: boolean;
    complementary?: boolean;
    triadic?: boolean;
    tetradic?: boolean;
    monochromatic?: boolean;
    locked?: boolean;
    shuffle?: boolean;
  } = {}
): Palette {
  const baseHsl = hexToHsl(baseHex);
  const baseRgb = hexToRgb(baseHex);

  const baseColor: Color = {
    hex: baseHex,
    rgb: baseRgb,
    hsl: baseHsl,
    oklch: rgbToOklch(baseRgb.r, baseRgb.g, baseRgb.b),
    name: "",
  };

  const result: Palette = {
    base: baseColor,
    harmonious: {
      analogous: [],
      complementary: [],
      triadic: [],
      tetradic: [],
    },
    monochromatic: [],
    shuffled: [],
    locked: options.locked ?? false,
  };

  if (options.analogous) {
    const colors = generateAnalogous(baseHsl, 5);
    result.harmonious.analogous = colors.map(c => ({
      hex: hslToHex(c.h, c.s, c.l),
      rgb: hslToRgb(c.h, c.s, c.l),
      hsl: c,
      oklch: rgbToOklch(hslToRgb(c.h, c.s, c.l).r, hslToRgb(c.h, c.s, c.l).g, hslToRgb(c.h, c.s, c.l).b),
      name: "",
    }));
  }

  if (options.complementary) {
    const colors = generateComplementary(baseHsl, 2);
    result.harmonious.complementary = colors.map(c => ({
      hex: hslToHex(c.h, c.s, c.l),
      rgb: hslToRgb(c.h, c.s, c.l),
      hsl: c,
      oklch: rgbToOklch(hslToRgb(c.h, c.s, c.l).r, hslToRgb(c.h, c.s, c.l).g, hslToRgb(c.h, c.s, c.l).b),
      name: "",
    }));
  }

  if (options.triadic) {
    const colors = generateTriadic(baseHsl, 3);
    result.harmonious.triadic = colors.map(c => ({
      hex: hslToHex(c.h, c.s, c.l),
      rgb: hslToRgb(c.h, c.s, c.l),
      hsl: c,
      oklch: rgbToOklch(hslToRgb(c.h, c.s, c.l).r, hslToRgb(c.h, c.s, c.l).g, hslToRgb(c.h, c.s, c.l).b),
      name: "",
    }));
  }

  if (options.tetradic) {
    const colors = generateTetradic(baseHsl, 4);
    result.harmonious.tetradic = colors.map(c => ({
      hex: hslToHex(c.h, c.s, c.l),
      rgb: hslToRgb(c.h, c.s, c.l),
      hsl: c,
      oklch: rgbToOklch(hslToRgb(c.h, c.s, c.l).r, hslToRgb(c.h, c.s, c.l).g, hslToRgb(c.h, c.s, c.l).b),
      name: "",
    }));
  }

  if (options.monochromatic) {
    const colors = generateMonochromatic(baseHsl, 5);
    result.monochromatic = colors.map(c => ({
      hex: hslToHex(c.h, c.s, c.l),
      rgb: hslToRgb(c.h, c.s, c.l),
      hsl: c,
      oklch: rgbToOklch(hslToRgb(c.h, c.s, c.l).r, hslToRgb(c.h, c.s, c.l).g, hslToRgb(c.h, c.s, c.l).b),
      name: "",
    }));
  }

  const allColors = [
    baseColor,
    ...result.harmonious.analogous,
    ...result.harmonious.complementary,
    ...result.harmonious.triadic,
    ...result.harmonious.tetradic,
    ...result.monochromatic,
  ];

  result.shuffled = options.shuffle ? shuffleColors(allColors) : allColors;
  if (options.locked) {
    result.shuffled = lockColors(result.shuffled);
  }

  return result;
}

function generatePalettesFromImage(
  imageData: ImageData | null,
  harmonyTypes: string[] = ["analogous", "complementary", "triadic", "tetradic", "monochromatic"]
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
    .map(([hex]) => hex);

  const result: { [key: string]: ReturnType<typeof generateColorPalette> } = {};
  topColors.forEach((color, idx) => {
    result[`palette-${idx + 1}`] = generateColorPalette(color, {
      analogous: harmonyTypes.includes("analogous"),
      complementary: harmonyTypes.includes("complementary"),
      triadic: harmonyTypes.includes("triadic"),
      tetradic: harmonyTypes.includes("tetradic"),
      monochromatic: harmonyTypes.includes("monochromatic"),
    });
  });

  return result;
}

function generateCSSVariables(palette: Palette, prefix = "--color"): string {
  let css = "";
  palette.shuffled.forEach((color, i) => {
    css += `${prefix}-${i}: ${color.hex};\n`;
  });
  return css;
}

function generateSCSSMap(palette: Palette, mapName = "color-palette", indent = 2): string {
  const spaces = " ".repeat(indent);
  let scss = `$${mapName}: (\n`;
  palette.shuffled.forEach((color, i) => {
    scss += `${spaces}  ${i}: "${color.hex}",\n`;
  });
  scss += "\n);\n";
  return scss;
}

function generateTailwindConfig(palette: Palette, colorName = "custom"): string {
  const colors: { [key: string]: string } = {};
  palette.shuffled.forEach((color, i) => {
    colors[i] = color.hex;
  });
  return JSON.stringify({ theme: { extend: { colors: { [colorName]: colors } } } }, null, 2);
}

function oklchToRgb(l: number, c: number, h: number): { r: number; g: number; b: number } {
  let hRad = h * Math.PI / 180;
  let a = c * Math.cos(hRad);
  let b = c * Math.sin(hRad);
  let l0 = l + 0.3965 * a + 0.2158 * b;
  let m0 = l - 0.1077 * a - 0.6687 * b;
  let s0 = l - 0.8973 * a + 0.4112 * b;

  let l1 = 0.2104 * l0 + 0.5362 * m0 - 0.0140 * s0;
  let m1 = 0.7876 * l0 - 0.9567 * m0 + 0.1176 * s0;
  let s1 = -0.2042 * l0 - 0.3676 * m0 + 1.6614 * s0;

  let r = 1.2270 * l1 - 1.6026 * m1 + 0.0456 * s1;
  let g = -0.0052 * l1 - 1.0424 * m1 + 1.0476 * s1;
  b = 0.1700 * l1 + 1.4056 * m1 - 0.1177 * s1;

  r = Math.pow(Math.max(0, r), 2.4);
  g = Math.pow(Math.max(0, g), 2.4);
  b = Math.pow(Math.max(0, b), 2.4);
  r = Math.max(0, Math.min(1, r)) * 255;
  g = Math.max(0, Math.min(1, g)) * 255;
  b = Math.max(0, Math.min(1, b)) * 255;

  return { r, g, b };
}

function rgbToOklch(r: number, g: number, b: number): { l: number; c: number; h: number } {
  const _r = r / 255;
  const _g = g / 255;
  const _b = b / 255;

  const r1 = _r > 0.04045 ? Math.pow((_r + 0.055) / 1.055, 2.4) : _r / 12.92;
  const g1 = _g > 0.04045 ? Math.pow((_g + 0.055) / 1.055, 2.4) : _g / 12.92;
  const b1 = _b > 0.04045 ? Math.pow((_b + 0.055) / 1.055, 2.4) : _b / 12.92;

  const rl = 0.4122214708 * r1 + 0.5363325663 * g1 + 0.0514459929 * b1;
  const gl = 0.2119034982 * r1 + 0.6806595453 * g1 + 0.1074369566 * b1;
  const bl = 0.0883024619 * r1 + 0.2818485177 * g1 + 0.8883050293 * b1;

  const l = 0.2103 * Math.cbrt(rl) - 0.5404 * Math.cbrt(gl) + 0.5508 * Math.cbrt(bl);
  const c = 0.3939 - 3.9615 * Math.cbrt(rl) + 4.0527 * Math.cbrt(gl) - 0.0641 * Math.cbrt(bl);
  const h = Math.atan2(2 * gl - rl, 2 * bl - rl);

  return {
    l: Math.max(0, Math.min(1, l)) * 100,
    c: Math.max(0, Math.min(1, c)) * 150,
    h: (h * 180 / Math.PI + 360) % 360,
  };
}

function hexToOklch(hex: string): { l: number; c: number; h: number } {
  const { r, g, b } = hexToRgb(hex);
  return rgbToOklch(r, g, b);
}

function randomColor(): Color {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  const hex = rgbToHex(r, g, b);
  const rgb = { r, g, b };
  const hsl = rgbToHsl(r, g, b);
  const oklch = rgbToOklch(r, g, b);
  return { hex, rgb, hsl, oklch, name: "" };
}

function lightenColor(color: Color, amount: number): Color {
  const hsl = { ...color.hsl, l: Math.min(100, color.hsl.l + amount) };
  const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
  const oklch = rgbToOklch(rgb.r, rgb.g, rgb.b);
  return { hex, rgb, hsl, oklch, name: color.name };
}

function darkenColor(color: Color, amount: number): Color {
  const hsl = { ...color.hsl, l: Math.max(0, color.hsl.l - amount) };
  const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
  const oklch = rgbToOklch(rgb.r, rgb.g, rgb.b);
  return { hex, rgb, hsl, oklch, name: color.name };
}

function mixColors(color1: Color, color2: Color, ratio: number): Color {
  ratio = Math.max(0, Math.min(1, ratio));
  const r = color1.rgb.r * (1 - ratio) + color2.rgb.r * ratio;
  const g = color1.rgb.g * (1 - ratio) + color2.rgb.g * ratio;
  const b = color1.rgb.b * (1 - ratio) + color2.rgb.b * ratio;
  const hex = rgbToHex(r, g, b);
  const hsl = rgbToHsl(r, g, b);
  const oklch = rgbToOklch(r, g, b);
  return { hex, rgb: { r, g, b }, hsl, oklch, name: "" };
}

export {
  type ColorFormat,
  type Color,
  type Palette,
  type HarmonyType,
  hexToRgb,
  rgbToHex,
  hexToHsl,
  generateColorPalette,
  generatePalettesFromImage,
  generateCSSVariables,
  generateSCSSMap,
  generateTailwindConfig,
  lockColors,
  shuffleColors,
  randomColor,
  lightenColor,
  darkenColor,
  mixColors,
};