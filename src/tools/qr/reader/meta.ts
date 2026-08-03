import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "reader",
  name: "mr.reader",
  tagline: "Scan QR codes and barcodes with your camera.",
  description: "mr.reader - Live QR and barcode scanner using your camera's built-in BarcodeDetector where available. Read-only camera, nothing uploaded. Falls back with an honest message on unsupported browsers.",
  tags: ["qr", "barcode", "scan", "camera"],
  icon: "eye",
  difficulty: "Medium",
  offline: true,
  related: ["qr", "ean"],
};
