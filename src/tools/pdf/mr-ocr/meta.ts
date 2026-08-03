import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "mr-ocr",
  name: "mr.ocr",
  tagline: "Extract text from scanned PDFs.",
  description: "mr.ocr - Pull the searchable text layer out of your PDF, page by page. True OCR of scanned images is a planned upgrade; this version reads the embedded text layer. Everything runs in your browser - nothing uploads.",
  tags: ["pdf", "ocr", "extract", "text", "scan"],
  icon: "ocr",
  difficulty: "Hard",
  offline: true,
  related: ["mr-form", "mr-convert"],
};
