export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Bounds {
  width: number;
  height: number;
}

export interface Aspect {
  w: number;
  h: number;
}

export function clampCropRect(crop: Rect, bounds: Bounds): Rect {
  let { x, y, w, h } = crop;
  if (w < 0) {
    x += w;
    w = -w;
  }
  if (h < 0) {
    y += h;
    h = -h;
  }
  w = Math.max(1, Math.min(Math.round(w), bounds.width));
  h = Math.max(1, Math.min(Math.round(h), bounds.height));
  x = Math.max(0, Math.min(Math.round(x), bounds.width - w));
  y = Math.max(0, Math.min(Math.round(y), bounds.height - h));
  return { x, y, w, h };
}

export function presetAspect(name: string): Aspect | null {
  switch (name) {
    case "1:1":
      return { w: 1, h: 1 };
    case "4:3":
      return { w: 4, h: 3 };
    case "16:9":
      return { w: 16, h: 9 };
    default:
      return null;
  }
}
