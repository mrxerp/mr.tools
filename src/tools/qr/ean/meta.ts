import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "ean",
  name: "mr.ean",
  tagline: "Batch-generate EAN-13 barcodes from pasted numbers.",
  description: "mr.ean — Paste a list of product numbers and generate EAN-13 barcodes in batch, with checksum validation and PNG export per item. Everything runs in your browser.",
  tags: ["qr", "barcode", "ean", "batch"],
  icon: "hash",
  difficulty: "Medium",
  offline: true,
  related: ["qr", "reader"],
};
