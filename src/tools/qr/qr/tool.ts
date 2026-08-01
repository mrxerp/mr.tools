import type { QRCodeErrorCorrectionLevel, QRCodeToDataURLOptions } from "qrcode";

export interface QrOptions {
  width: number;
  margin: number;
  errorCorrectionLevel: QRCodeErrorCorrectionLevel;
}

export const MAX_TEXT_LENGTH = 2000;

const LEVELS: QRCodeErrorCorrectionLevel[] = ["L", "M", "Q", "H"];

function clampInt(value: number | undefined, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function normalizeQrText(text: string): string {
  const trimmed = (text ?? "").trim();
  return trimmed.length > MAX_TEXT_LENGTH ? trimmed.slice(0, MAX_TEXT_LENGTH) : trimmed;
}

export function normalizeQrOptions(options?: Partial<QrOptions>): QRCodeToDataURLOptions {
  const level = options?.errorCorrectionLevel;
  return {
    width: clampInt(options?.width, 96, 1024, 256),
    margin: clampInt(options?.margin, 0, 16, 4),
    errorCorrectionLevel: level && LEVELS.includes(level) ? level : "M",
  };
}

export async function generateQrDataUrl(
  text: string,
  options?: Partial<QrOptions>,
): Promise<string> {
  const mod = (await import("qrcode")) as unknown as {
    default?: typeof import("qrcode");
  } & typeof import("qrcode");
  const QRCode = mod.default ?? mod;
  return QRCode.toDataURL(normalizeQrText(text), normalizeQrOptions(options));
}
