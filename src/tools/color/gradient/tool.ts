export type GradientType = "linear" | "radial" | "conic";

export interface GradientStop {
  color: string;
  position: number;
}

export interface GradientConfig {
  type: GradientType;
  stops: GradientStop[];
  angle: number;
  shape?: "circle" | "ellipse";
  position?: string;
  size?: "closest-side" | "farthest-side" | "closest-corner" | "farthest-corner" | "cover" | "contain";
}

export interface GradientPreset {
  name: string;
  config: GradientConfig;
}

function parseColor(color: string): { r: number; g: number; b: number } | null {
  const clean = color.replace(/^#/, "");
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
  return null;
}

function interpolateColor(c1: { r: number; g: number; b: number }, c2: { r: number; g: number; b: number }, t: number): string {
  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export function generateGradientCSS(config: GradientConfig): string {
  const sortedStops = [...config.stops].sort((a, b) => a.position - b.position);
  const stopsStr = sortedStops.map(s => `${s.color} ${Math.round(s.position * 100)}%`).join(", ");

  if (config.type === "linear") {
    return `linear-gradient(${config.angle}deg, ${stopsStr})`;
  }
  if (config.type === "radial") {
    const shape = config.shape || "ellipse";
    const size = config.size || "farthest-corner";
    const position = config.position || "center";
    return `radial-gradient(${shape} ${size} at ${position}, ${stopsStr})`;
  }
  if (config.type === "conic") {
    const position = config.position || "center";
    return `conic-gradient(from ${config.angle}deg at ${position}, ${stopsStr})`;
  }
  return `linear-gradient(${config.angle}deg, ${stopsStr})`;
}

export function gradientToCanvas(
  config: GradientConfig,
  width = 400,
  height = 200
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  if (config.type === "linear") {
    const angle = (config.angle * Math.PI) / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const halfW = width / 2;
    const halfH = height / 2;
    const maxDist = Math.max(
      Math.abs(cos * halfW) + Math.abs(sin * halfH),
      Math.abs(cos * halfW) - Math.abs(sin * halfH)
    );

    const gradient = ctx.createLinearGradient(
      halfW - cos * maxDist,
      halfH - sin * maxDist,
      halfW + cos * maxDist,
      halfH + sin * maxDist
    );
    [...config.stops].sort((a, b) => a.position - b.position).forEach(s => {
      gradient.addColorStop(s.position, s.color);
    });
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  } else if (config.type === "radial") {
    const cx = width / 2;
    const cy = height / 2;
    const maxR = Math.sqrt(cx * cx + cy * cy);
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
    [...config.stops].sort((a, b) => a.position - b.position).forEach(s => {
      gradient.addColorStop(s.position, s.color);
    });
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  } else if (config.type === "conic") {
    const cx = width / 2;
    const cy = height / 2;
    const gradient = ctx.createConicGradient((config.angle * Math.PI) / 180, cx, cy);
    [...config.stops].sort((a, b) => a.position - b.position).forEach(s => {
      gradient.addColorStop(s.position, s.color);
    });
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }
  return canvas;
}

export function addStop(config: GradientConfig, color: string, position?: number): GradientConfig {
  const newStop: GradientStop = {
    color,
    position: position ?? Math.random(),
  };
  return {
    ...config,
    stops: [...config.stops, newStop].sort((a, b) => a.position - b.position),
  };
}

export function removeStop(config: GradientConfig, index: number): GradientConfig {
  return {
    ...config,
    stops: config.stops.filter((_, i) => i !== index),
  };
}

export function updateStop(config: GradientConfig, index: number, updates: Partial<GradientStop>): GradientConfig {
  return {
    ...config,
    stops: config.stops.map((s, i) => (i === index ? { ...s, ...updates } : s)),
  };
}

export const PRESETS: GradientPreset[] = [
  {
    name: "Sunset",
    config: {
      type: "linear",
      angle: 135,
      stops: [
        { color: "#ff9a9e", position: 0 },
        { color: "#fecfef", position: 0.5 },
        { color: "#fecfef", position: 1 },
      ],
    },
  },
  {
    name: "Ocean",
    config: {
      type: "linear",
      angle: 180,
      stops: [
        { color: "#00c9ff", position: 0 },
        { color: "#92fe9d", position: 1 },
      ],
    },
  },
  {
    name: "Fire",
    config: {
      type: "linear",
      angle: 90,
      stops: [
        { color: "#f12711", position: 0 },
        { color: "#f5af19", position: 1 },
      ],
    },
  },
  {
    name: "Forest",
    config: {
      type: "linear",
      angle: 135,
      stops: [
        { color: "#134e5e", position: 0 },
        { color: "#71b280", position: 1 },
      ],
    },
  },
  {
    name: "Violet",
    config: {
      type: "radial",
      shape: "circle",
      size: "farthest-corner",
      stops: [
        { color: "#667eea", position: 0 },
        { color: "#764ba2", position: 1 },
      ],
    },
  },
  {
    name: "Golden Hour",
    config: {
      type: "conic",
      angle: 0,
      stops: [
        { color: "#f6d365", position: 0 },
        { color: "#fda085", position: 0.5 },
        { color: "#f6d365", position: 1 },
      ],
    },
  },
  {
    name: "Midnight",
    config: {
      type: "linear",
      angle: 135,
      stops: [
        { color: "#141e30", position: 0 },
        { color: "#243b55", position: 1 },
      ],
    },
  },
  {
    name: "Purple Rain",
    config: {
      type: "linear",
      angle: 90,
      stops: [
        { color: "#a8c0ff", position: 0 },
        { color: "#3f2b96", position: 1 },
      ],
    },
  },
  {
    name: "Citrus",
    config: {
      type: "radial",
      shape: "ellipse",
      size: "cover",
      stops: [
        { color: "#fc4a1a", position: 0 },
        { color: "#f7b733", position: 1 },
      ],
    },
  },
  {
    name: "Rainbow Conic",
    config: {
      type: "conic",
      angle: 0,
      stops: [
        { color: "#ff0000", position: 0 },
        { color: "#ffff00", position: 0.16 },
        { color: "#00ff00", position: 0.33 },
        { color: "#00ffff", position: 0.5 },
        { color: "#0000ff", position: 0.66 },
        { color: "#ff00ff", position: 0.83 },
        { color: "#ff0000", position: 1 },
      ],
    },
  },
];

export function createDefaultGradient(type: GradientType = "linear"): GradientConfig {
  return {
    type,
    angle: type === "linear" ? 90 : 0,
    stops: [
      { color: "#5a5bd9", position: 0 },
      { color: "#fafaf8", position: 1 },
    ],
    shape: "ellipse",
    size: "farthest-corner",
    position: "center",
  };
}

export function parseGradientCSS(css: string): GradientConfig | null {
  css = css.trim();
  if (css.startsWith("linear-gradient")) {
    const match = css.match(/linear-gradient\(([^)]+)\)/);
    if (!match) return null;
    const content = match[1];
    const parts = content.split(",").map(p => p.trim());
    let angle = 90;
    let firstIsAngle = false;
    if (parts[0].endsWith("deg")) {
      angle = parseInt(parts[0], 10);
      firstIsAngle = true;
    }
    const stops: GradientStop[] = [];
    const startIdx = firstIsAngle ? 1 : 0;
    parts.slice(startIdx).forEach(p => {
      const stopMatch = p.match(/(#[0-9a-fA-F]{3,8})\s+(\d+)%?/);
      if (stopMatch) {
        stops.push({ color: stopMatch[1], position: parseInt(stopMatch[2], 10) / 100 });
      }
    });
    return { type: "linear", angle, stops };
  }
  if (css.startsWith("radial-gradient")) {
    const match = css.match(/radial-gradient\(([^)]+)\)/);
    if (!match) return null;
    return { type: "radial", angle: 0, stops: [], shape: "ellipse", size: "farthest-corner", position: "center" };
  }
  if (css.startsWith("conic-gradient")) {
    const match = css.match(/conic-gradient\(([^)]+)\)/);
    if (!match) return null;
    return { type: "conic", angle: 0, stops: [], position: "center" };
  }
  return null;
}