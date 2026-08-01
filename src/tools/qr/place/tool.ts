import { generateQrDataUrl, type QrOptions } from "../qr/tool.ts";

export interface PlaceData {
  address?: string;
  lat?: string;
  lng?: string;
  label?: string;
}

export function parseCoordinate(value: string): number | null {
  const s = (value ?? "").trim().replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function isValidLat(lat: number): boolean {
  return lat >= -90 && lat <= 90;
}

export function isValidLng(lng: number): boolean {
  return lng >= -180 && lng <= 180;
}

export function coordsOf(data: PlaceData): { lat: number; lng: number } | null {
  const lat = parseCoordinate(data.lat ?? "");
  const lng = parseCoordinate(data.lng ?? "");
  if (lat === null || lng === null || !isValidLat(lat) || !isValidLng(lng)) return null;
  return { lat, lng };
}

export function buildGeoUrl(data: PlaceData): string {
  const c = coordsOf(data);
  if (!c) return "";
  return `geo:${c.lat},${c.lng}`;
}

export function buildMapsUrl(data: PlaceData): string {
  const c = coordsOf(data);
  const address = (data.address ?? "").trim();
  if (c) {
    if (address || data.label?.trim()) {
      const q = encodeURIComponent((address || (data.label ?? "")).trim());
      return `https://www.google.com/maps/search/?api=1&query=${q}&center=${c.lat},${c.lng}&zoom=16`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${c.lat},${c.lng}`;
  }
  if (address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  }
  return "";
}

export function generatePlaceQrDataUrl(
  data: PlaceData,
  format: "geo" | "maps",
  options?: Partial<QrOptions>,
): Promise<string> {
  const text = format === "geo" ? buildGeoUrl(data) : buildMapsUrl(data);
  if (!text) return Promise.reject(new Error("Enter an address or valid coordinates."));
  return generateQrDataUrl(text, options);
}
