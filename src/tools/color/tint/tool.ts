export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

export interface ScaleOptions {
  baseColor: string;
  hue?: number;
  chroma?: number;
  lightnessRange?: [number, number];
  steps?: number;
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

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, "0")).join("")}`;
}

function srgbToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function linearToSrgb(c: number): number {
  return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
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

function oklchToRgb(l: number, c: number, h: number): { r: number; g: number; b: number } {
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);
  const l0 = l + 0.3965 * a + 0.2158 * b;
  const m0 = l - 0.1077 * a - 0.6687 * b;
  const s0 = l - 0.8973 * a + 0.4112 * b;
  const l1 = 0.2104 * l0 + 0.5362 * m0 - 0.0140 * s0;
  const m1 = 0.7876 * l0 - 0.9567 * m0 + 0.1176 * s0;
  const s1 = -0.2042 * l0 - 0.3676 * m0 + 1.6614 * s0;
  let r = 1.2270 * l1 - 1.6026 * m1 + 0.0456 * s1;
  let g = -0.0052 * l1 - 1.0424 * m1 + 1.0476 * s1;
  let b2 = 0.1700 * l1 + 1.4056 * m1 - 0.1177 * s1;
  r = Math.pow(Math.max(0, r), 2.4);
  g = Math.pow(Math.max(0, g), 2.4);
  b2 = Math.pow(Math.max(0, b2), 2.4);
  return {
    r: Math.max(0, Math.min(1, r)) * 255,
    g: Math.max(0, Math.min(1, g)) * 255,
    b: Math.max(0, Math.min(1, b2)) * 255,
  };
}

function generateScale(
  baseL: number,
  baseC: number,
  baseH: number,
  options: {
    lightnessRange?: [number, number];
    steps?: number;
    chromaMultiplier?: number;
  } = {}
): ColorScale {
  const { lightnessRange = [5, 98], steps = 11, chromaMultiplier = 1 } = options;
  const scaleLevels = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  const result: Record<string, string> = {};

  const targetLightness = scaleLevels.map(level => {
    const t = (level - 50) / 900;
    return lightnessRange[0] + (lightnessRange[1] - lightnessRange[0]) * t;
  });

  const targetChroma = scaleLevels.map((level, i) => {
    const targetL = targetLightness[i];
    if (targetL > 95) return Math.max(0, baseC * 0.1 * chromaMultiplier);
    if (targetL > 80) return Math.max(0, baseC * 0.3 * chromaMultiplier);
    if (targetL > 60) return baseC * 0.7 * chromaMultiplier;
    if (targetL > 40) return baseC * 1.1 * chromaMultiplier;
    if (targetL > 20) return baseC * 0.9 * chromaMultiplier;
    return baseC * 0.4 * chromaMultiplier;
  });

  scaleLevels.forEach((level, i) => {
    const { r, g, b } = oklchToRgb(targetLightness[i], targetChroma[i], baseH);
    result[level] = rgbToHex(r, g, b);
  });

  return result as ColorScale;
}

export function generateColorScale(baseColor: string, options: Partial<ScaleOptions> = {}): ColorScale {
  const { r, g, b } = hexToRgb(baseColor);
  const oklch = rgbToOklch(r, g, b);
  return generateScale(oklch.l, oklch.c, oklch.h, options);
}

export function generateScaleFromHue(
  hue: number,
  chroma = 0.15,
  lightnessRange: [number, number] = [5, 98]
): ColorScale {
  return generateScale(50, chroma * 150, hue, { lightnessRange });
}

export function generateCSSVariables(scale: ColorScale, prefix = "color"): string {
  let css = ":root {\n";
  const levels = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  levels.forEach(level => {
    css += `  --${prefix}-${level}: ${scale[level]};\n`;
  });
  css += "}\n";
  return css;
}

export function generateSCSSMap(scale: ColorScale, mapName = "color-scale"): string {
  let scss = `$${mapName}: (\n`;
  const levels = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  levels.forEach(level => {
    scss += `  ${level}: "${scale[level]}",\n`;
  });
  scss += ");\n";
  return scss;
}

export function generateTailwindConfig(scale: ColorScale, colorName = "custom"): string {
  const levels = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  const colors: Record<string, string> = {};
  levels.forEach(level => {
    colors[level] = scale[level];
  });
  return JSON.stringify({
    theme: {
      extend: {
        colors: {
          [colorName]: colors,
        },
      },
    },
  }, null, 2);
}

export function generateCSSColorMod(scale: ColorScale, baseLevel = 500): string {
  const base = scale[baseLevel];
  const levels = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  let css = `:root {\n  --${baseLevel}-base: ${base};\n`;
  levels.forEach(level => {
    if (level !== baseLevel) {
      const ratio = level / baseLevel;
      css += `  --color-${level}: color(var(--${baseLevel}-base) lightness(${ratio * 100}%));\n`;
    }
  });
  css += "}\n";
  return css;
}

export function getContrastRatios(scale: ColorScale): Record<string, { onWhite: number; onBlack: number }> {
  const levels = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  const result: Record<string, { onWhite: number; onBlack: number }> = {};

  function contrastRatio(fg: string, bg: string): number {
    const { r: fr, g: fgG, b: fb } = hexToRgb(fg);
    const { r: br, g: bgG, b: bb } = hexToRgb(bg);
    const luminance = (r: number, g: number, b: number) => {
      const lr = srgbToLinear(r);
      const lg = srgbToLinear(g);
      const lb = srgbToLinear(b);
      return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
    };
    const l1 = luminance(fr, fgG, fb);
    const l2 = luminance(br, bgG, bb);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }

  levels.forEach(level => {
    result[level] = {
      onWhite: Math.round(contrastRatio(scale[level], "#ffffff") * 100) / 100,
      onBlack: Math.round(contrastRatio(scale[level], "#000000") * 100) / 100,
    };
  });
  return result;
}

export function findAccessiblePairs(
  scale: ColorScale,
  minRatio = 4.5
): { foreground: string; background: string; ratio: number; level: string }[] {
  const pairs: { foreground: string; background: string; ratio: number; level: string }[] = [];
  const levels = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

  for (let i = 0; i < levels.length; i++) {
    for (let j = i + 1; j < levels.length; j++) {
      const ratio = contrastRatio(scale[levels[i]], scale[levels[j]]);
      if (ratio >= minRatio) {
        pairs.push({
          foreground: scale[levels[i]],
          background: scale[levels[j]],
          ratio: Math.round(ratio * 100) / 100,
          level: `${levels[i]}-${levels[j]}`,
        });
      }
    }
  }
  return pairs.sort((a, b) => b.ratio - a.ratio);
}

function contrastRatio(fg: string, bg: string): number {
  const { r: fr, g: fgG, b: fb } = hexToRgb(fg);
  const { r: br, g: bgG, b: bb } = hexToRgb(bg);
  const luminance = (r: number, g: number, b: number) => {
    const lr = srgbToLinear(r);
    const lg = srgbToLinear(g);
    const lb = srgbToLinear(b);
    return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
  };
  const l1 = luminance(fr, fgG, fb);
  const l2 = luminance(br, bgG, bb);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}