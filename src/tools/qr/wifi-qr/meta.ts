import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "wifi-qr",
  name: "mr.wifi qr",
  tagline: "Turn your Wi-Fi login into a scannable QR code.",
  description: "mr.wifi qr — Generate a QR that joins your Wi-Fi network by scanning, with security type (WPA/WEP/open) and hidden-network support. Everything runs in your browser.",
  tags: ["qr", "wifi", "network", "generate"],
  icon: "qr",
  difficulty: "Easy",
  offline: true,
  related: ["qr", "vcard", "place"],
};
