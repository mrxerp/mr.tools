import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "mr-convert",
  name: "mr.convert",
  tagline: "Convert PDF pages to images or extract text.",
  description: "Convert PDF pages to PNG images or extract per-page text. Everything runs in your browser.",
  tags: ["pdf", "convert", "image", "png", "text", "extract"],
  icon: "convert",
  difficulty: "Medium",
  offline: true,
  related: ["mr-split", "mr-unlock"],
};
