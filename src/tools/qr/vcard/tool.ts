import { generateQrDataUrl, type QrOptions } from "../qr/tool.ts";

export interface VCardData {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phone?: string;
  email?: string;
  org?: string;
  title?: string;
  url?: string;
  street?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
}

function esc(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\r?\n/g, "\\n");
}

export function buildVCard(data: VCardData): string {
  const lines: string[] = [];
  const first = (data.firstName ?? "").trim();
  const last = (data.lastName ?? "").trim();
  const full = (data.fullName ?? "").trim() || `${first} ${last}`.trim();
  const street = (data.street ?? "").trim();
  const city = (data.city ?? "").trim();
  const region = (data.region ?? "").trim();
  const postal = (data.postalCode ?? "").trim();
  const country = (data.country ?? "").trim();

  if (last || first) lines.push(`N:${esc(last)};${esc(first)};;;`);
  if (full) lines.push(`FN:${esc(full)}`);
  if (data.phone?.trim()) lines.push(`TEL;TYPE=CELL:${data.phone.trim()}`);
  if (data.email?.trim()) lines.push(`EMAIL:${data.email.trim()}`);
  if (data.org?.trim()) lines.push(`ORG:${esc(data.org.trim())}`);
  if (data.title?.trim()) lines.push(`TITLE:${esc(data.title.trim())}`);
  if (data.url?.trim()) lines.push(`URL:${data.url.trim()}`);
  if (street || city || region || postal || country) {
    lines.push(`ADR;TYPE=HOME:;;${esc(street)};${esc(city)};${esc(region)};${esc(postal)};${esc(country)}`);
  }
  if (lines.length === 0) return "";
  return ["BEGIN:VCARD", "VERSION:3.0", ...lines, "END:VCARD"].join("\r\n");
}

export function generateVCardQrDataUrl(
  data: VCardData,
  options?: Partial<QrOptions>,
): Promise<string> {
  const text = buildVCard(data);
  if (!text) return Promise.reject(new Error("Add at least one contact field."));
  return generateQrDataUrl(text, options);
}
