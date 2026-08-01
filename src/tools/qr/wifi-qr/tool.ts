import { generateQrDataUrl, type QrOptions } from "../qr/tool.ts";

export type WifiSecurity = "WPA" | "WEP" | "nopass";

export interface WifiConfig {
  ssid: string;
  password: string;
  security: WifiSecurity;
  hidden: boolean;
}

const ESCAPE_RE = /([\\;,:"])/g;

export function escapeWifiValue(value: string): string {
  return value.replace(ESCAPE_RE, "\\$1");
}

export function buildWifiString(config: WifiConfig): string {
  const ssid = config.ssid.trim();
  if (!ssid) return "";
  if (config.security !== "nopass" && !config.password) return "";
  let out = `WIFI:S:${escapeWifiValue(ssid)};`;
  out +=
    config.security === "nopass"
      ? "T:nopass;"
      : `T:${config.security};P:${escapeWifiValue(config.password)};`;
  if (config.hidden) out += "H:true;";
  return `${out};`;
}

export function generateWifiQrDataUrl(
  config: WifiConfig,
  options?: Partial<QrOptions>,
): Promise<string> {
  const text = buildWifiString(config);
  if (!text) return Promise.reject(new Error("Enter the SSID (and password for secured networks)."));
  return generateQrDataUrl(text, options);
}
