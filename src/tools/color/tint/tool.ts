export interface ColorScale {
  [key: number]: string;
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
  // OKLCH to sRGB conversion
  // 1. OKLCH to OKLAB
  const lNorm = l / 100;
  const cNorm = c / 150;
  const hRad = (h * Math.PI) / 180;
  const a = cNorm * Math.cos(hRad);
  const b_oklab = cNorm * Math.sin(hRad);

  // 2. OKLAB to linear RGB (using standard OKLAB to linear RGB matrix)
  const l_ = lNorm + 0.3963377774 * a + 0.2158037573 * b_oklab;
  const m_ = lNorm - 0.1055613458 * a - 0.0638541728 * b_oklab;
  const s_ = lNorm - 0.0894841775 * a - 1.2914855480 * b_oklab;

  // 3. Linear RGB to sRGB (with gamut clipping)
  let r = 4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_;
  let g = -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_;
  let b_lin = -0.0041960863 * l_ - 0.7034186147 * m_ + 1.7076147010 * s_;

  // Apply sRGB gamma correction
  const toSrgb = (x: number) => x <= 0.0031308 ? x * 12.92 : 1.055 * Math.pow(Math.max(0, x), 1/2.4) - 0.055;
  return {
    r: Math.max(0, Math.min(1, toSrgb(r))) * 255,
    g: Math.max(0, Math.min(1, toSrgb(g))) * 255,
    b: Math.max(0, Math.min(1, toSrgb(b_lin))) * 255,
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

  // Find the index of level 500 (should be at index 5)
  const baseIndex = scaleLevels.indexOf(500);

  // Compute target lightness values that ensure base color is at level 500
  // We interpolate from lightnessRange[0] to baseL, then from baseL to lightnessRange[1]
  const targetLightness = scaleLevels.map((level, i) => {
    if (i <= baseIndex) {
      // Interpolate from lightnessRange[0] to baseL
      const t = i / baseIndex;
      return lightnessRange[0] + (baseL - lightnessRange[0]) * t;
    } else {
      // Interpolate from baseL to lightnessRange[1]
      const t = (i - baseIndex) / (scaleLevels.length - 1 - baseIndex);
      return baseL + (lightnessRange[1] - baseL) * t;
    }
  });

  const targetChroma = scaleLevels.map((level, i) => {
    if (i === baseIndex) {
      return baseC; // Exact base chroma at level 500
    }
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

  return result as unknown as ColorScale;
}

export function generateColorScale(baseColor: string, options: Partial<ScaleOptions> = {}): ColorScale {
  const { r, g, b } = hexToRgb(baseColor);
  const oklch = rgbToOklch(r, g, b);
  const scale = generateScale(oklch.l, oklch.c, oklch.h, options);
  // Ensure the base color is exactly at level 500
  scale[500] = baseColor.toLowerCase().startsWith('#') ? baseColor.toLowerCase() : '#' + baseColor.toLowerCase();
  return scale;
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