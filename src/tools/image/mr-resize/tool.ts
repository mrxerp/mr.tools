export interface Size {
  width: number;
  height: number;
}

export interface TargetRequest {
  width?: number | null;
  height?: number | null;
}

export function computeTargetSize(
  origW: number,
  origH: number,
  requested: TargetRequest,
  keepAspect: boolean,
): Size | null {
  if (origW <= 0 || origH <= 0) return null;
  const w = requested.width && requested.width > 0 ? requested.width : null;
  const h = requested.height && requested.height > 0 ? requested.height : null;
  if (w === null && h === null) return null;
  if (w !== null && h !== null && !keepAspect) {
    return { width: Math.max(1, Math.round(w)), height: Math.max(1, Math.round(h)) };
  }
  const scale = Math.min(
    w !== null ? w / origW : Infinity,
    h !== null ? h / origH : Infinity,
  );
  return {
    width: Math.max(1, Math.round(origW * scale)),
    height: Math.max(1, Math.round(origH * scale)),
  };
}
