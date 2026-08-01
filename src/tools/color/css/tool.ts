export interface ExtractedColor {
  hex: string;
  rgb: { r: number; g: number; b: number };
  count: number;
  name: string;
}

export interface ExportFormats {
  cssVariables: string;
  scssMap: string;
  tailwindConfig: string;
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

function colorName(hex: string): string {
  const normalized = hex.toLowerCase().replace(/^#/, "");
  const names: Record<string, string> = {
    "#000000": "black",
    "#ffffff": "white",
    "#ff0000": "red",
    "#00ff00": "lime",
    "#0000ff": "blue",
    "#ffff00": "yellow",
    "#00ffff": "cyan",
    "#ff00ff": "magenta",
    "#c0c0c0": "silver",
    "#808080": "gray",
    "#800000": "maroon",
    "#800080": "purple",
    "#008000": "green",
    "#008080": "teal",
    "#000080": "navy",
    "#ffa500": "orange",
    "#ffd700": "gold",
  };
  return names[normalized] || `color-${normalized.slice(0, 6)}`;
}

function quantizeColors(pixels: Uint8ClampedArray, maxColors = 20): ExtractedColor[] {
  const colorMap = new Map<string, number>();
  for (let i = 0; i < pixels.length; i += 4) {
    const [r, g, b] = [pixels[i], pixels[i + 1], pixels[i + 2]];
    const hex = rgbToHex(r, g, b);
    colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
  }
  return Array.from(colorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxColors)
    .map(([hex, count]) => ({
      hex,
      rgb: hexToRgb(hex),
      count,
      name: colorName(hex),
    }));
}

function parseHexList(input: string): string[] {
  return input
    .split(/[\s,]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && /^#[0-9a-fA-F]{3,6}$/.test(s))
    .map(s => s.toLowerCase());
}

function generateShades(baseHex: string, count = 10): string[] {
  const { r, g, b } = hexToRgb(baseHex);
  const hsl = rgbToHsl(r, g, b);
  const shades: string[] = [];
  for (let i = 0; i < count; i++) {
    const l = 5 + (90 * i) / (count - 1);
    const { r: sr, g: sg, b: sb } = hslToRgb(hsl.h, hsl.s, l);
    shades.push(rgbToHex(sr, sg, sb));
  }
  return shades;
}

export function extractFromImage(
  imageData: ImageData | null,
  maxColors = 10
): ExtractedColor[] {
  if (!imageData) return [];
  return quantizeColors(imageData.data, maxColors);
}

export function extractFromHexList(hexList: string): ExtractedColor[] {
  const colors = parseHexList(hexList);
  return colors.map(hex => ({
    hex,
    rgb: hexToRgb(hex),
    count: 1,
    name: colorName(hex),
  }));
}

export function generateExports(
  colors: ExtractedColor[],
  prefix = "color",
  includeShades = false
): ExportFormats {
  const primaryColors = colors.slice(0, 10);
  let css = ":root {\n";
  let scss = `$${prefix}-palette: (\n`;
  const tailwindColors: Record<string, string> = {};

  primaryColors.forEach((color, i) => {
    const varName = `--${prefix}-${i + 1}`;
    css += `  ${varName}: ${color.hex};\n`;
    scss += `  ${i + 1}: "${color.hex}",\n`;
    tailwindColors[`${i + 1}`] = color.hex;
  });

  css += "}\n";
  scss += ");\n";

  let tailwind = JSON.stringify({
    theme: {
      extend: {
        colors: {
          [prefix]: tailwindColors,
        },
      },
    },
  }, null, 2);

  if (includeShades && primaryColors.length > 0) {
    const baseColor = primaryColors[0];
    const shades = generateShades(baseColor.hex, 10);
    css += "\n/* Shades */\n";
    shades.forEach((shade, i) => {
      const level = (i + 1) * 100;
      css += `  --${prefix}-${level}: ${shade};\n`;
      scss += `  ${level}: "${shade}",\n`;
      tailwindColors[`${level}`] = shade;
    });
    tailwind = JSON.stringify({
      theme: {
        extend: {
          colors: {
            [prefix]: tailwindColors,
          },
        },
      },
    }, null, 2);
  }

  return { cssVariables: css, scssMap: scss, tailwindConfig: tailwind };
}

export function generateSampleComponent(colors: ExtractedColor[], format: "html" | "react" | "vue"): string {
  const primaryColors = colors.slice(0, 5);
  if (format === "html") {
    return `<div class="color-palette-preview">
  <style>
    :root {
${primaryColors.map((c, i) => `      --color-${i + 1}: ${c.hex};`).join("\n")}
    }
    .palette-swatch {
      width: 60px;
      height: 60px;
      border-radius: 8px;
      display: inline-block;
      margin: 4px;
    }
    .palette-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
  </style>
  <div class="palette-grid">
${primaryColors.map((c, i) => `    <div class="palette-swatch" style="background: var(--color-${i + 1})" title="${c.hex}"></div>`).join("\n")}
  </div>
</div>`;
  }
  if (format === "react") {
    return `import React from 'react';

const colors = [
${primaryColors.map(c => `  '${c.hex}',`).join("\n")}
];

export function ColorPalette() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {colors.map((color, i) => (
        <div
          key={i}
          style={{
            width: 60,
            height: 60,
            borderRadius: 8,
            background: color,
          }}
          title={color}
        />
      ))}
    </div>
  );
}`;
  }
  return `<template>
  <div class="palette-grid">
    <div
      v-for="(color, i) in colors"
      :key="i"
      class="palette-swatch"
      :style="{ background: color }"
      :title="color"
    />
  </div>
</template>

<script>
export default {
  data() {
    return {
      colors: [
${primaryColors.map(c => `        '${c.hex}',`).join("\n")}
      ],
    };
  },
};
</script>

<style scoped>
.palette-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.palette-swatch { width: 60px; height: 60px; border-radius: 8px; }
</style>`;
}

export function colorToFormat(hex: string, format: "hex" | "rgb" | "hsl" | "hwb"): string {
  const rgb = hexToRgb(hex);
  switch (format) {
    case "hex":
      return hex;
    case "rgb":
      return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    case "hsl": {
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      return `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`;
    }
    case "hwb": {
      const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);
      const w = l / 100 * (1 - s / 100);
      const b = 1 - l / 100 - w;
      return `hwb(${Math.round(h)} ${Math.round(w * 100)}% ${Math.round(b * 100)}%)`;
    }
  }
}

export function sortColorsByHue(colors: ExtractedColor[]): ExtractedColor[] {
  return [...colors].sort((a, b) => {
    const ha = rgbToHsl(a.rgb.r, a.rgb.g, a.rgb.b).h;
    const hb = rgbToHsl(b.rgb.r, b.rgb.g, b.rgb.b).h;
    return ha - hb;
  });
}

export function sortColorsByLightness(colors: ExtractedColor[]): ExtractedColor[] {
  return [...colors].sort((a, b) => {
    const la = rgbToHsl(a.rgb.r, a.rgb.g, a.rgb.b).l;
    const lb = rgbToHsl(b.rgb.r, b.rgb.g, b.rgb.b).l;
    return la - lb;
  });
}