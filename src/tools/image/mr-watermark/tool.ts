/** Watermark layout math. Deterministic, no DOM. */

export type Position = "tl" | "tc" | "tr" | "bl" | "bc" | "br" | "cc";

export function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/** Top-left corner of a watermark mark of markW x markH inside a target image. */
export function watermarkRect(
  totalW: number,
  totalH: number,
  markW: number,
  markH: number,
  position: Position,
  margin: number,
): { x: number; y: number } {
  const m = Math.max(0, margin);
  let x: number;
  let y: number;
  switch (position) {
    case "tl":
      x = m;
      y = m;
      break;
    case "tc":
      x = (totalW - markW) / 2;
      y = m;
      break;
    case "tr":
      x = totalW - markW - m;
      y = m;
      break;
    case "bl":
      x = m;
      y = totalH - markH - m;
      break;
    case "bc":
      x = (totalW - markW) / 2;
      y = totalH - markH - m;
      break;
    case "br":
      x = totalW - markW - m;
      y = totalH - markH - m;
      break;
    default:
      x = (totalW - markW) / 2;
      y = (totalH - markH) / 2;
      break;
  }
  const cx = Math.max(0, Math.min(totalW - markW, Math.round(x)));
  const cy = Math.max(0, Math.min(totalH - markH, Math.round(y)));
  return { x: cx, y: cy };
}

/** Scales an image watermark so its width is `scale` of the target width. */
export function scaledMarkSize(
  totalW: number,
  totalH: number,
  markW: number,
  markH: number,
  scale: number,
): { w: number; h: number } {
  const s = clamp01(scale);
  if (markW <= 0 || markH <= 0) return { w: 0, h: 0 };
  const ratio = markH / markW;
  let w = totalW * s;
  let h = w * ratio;
  const maxH = totalH * 0.9;
  if (h > maxH) {
    h = maxH;
    w = h / ratio;
  }
  return { w: Math.max(1, Math.round(w)), h: Math.max(1, Math.round(h)) };
}

/** Font size (px) for a text watermark, scaled to the target. */
export function textWatermarkSize(totalW: number, totalH: number, scale: number): number {
  const s = clamp01(scale);
  return Math.max(8, Math.round(Math.min(totalW, totalH) * s));
}

/** Grid of tile top-left corners for a repeating watermark. */
export function tileOffsets(
  totalW: number,
  totalH: number,
  markW: number,
  markH: number,
  gap: number,
): { x: number; y: number }[] {
  const g = Math.max(0, gap);
  const stepX = Math.max(1, markW + g);
  const stepY = Math.max(1, markH + g);
  const tiles: { x: number; y: number }[] = [];
  for (let y = 0; y < totalH; y += stepY) {
    for (let x = 0; x < totalW; x += stepX) {
      tiles.push({ x: Math.round(x), y: Math.round(y) });
    }
  }
  return tiles;
}
