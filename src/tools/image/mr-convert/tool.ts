export type ImageFormat = "png" | "jpeg" | "webp";

export function normalizeFormat(fmt: string): ImageFormat {
  const f = (fmt ?? "").trim().toLowerCase().replace(/^image\//, "");
  if (f === "jpg" || f === "jpeg") return "jpeg";
  if (f === "webp") return "webp";
  return "png";
}

export function canEncode(type: string): boolean {
  if (typeof document === "undefined") return false;
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const fmt = normalizeFormat(type);
  return canvas.toDataURL(`image/${fmt}`).startsWith(`data:image/${fmt}`);
}

export function clampQuality(quality: number): number {
  if (!Number.isFinite(quality)) return 0.92;
  return Math.min(1, Math.max(0, quality));
}
