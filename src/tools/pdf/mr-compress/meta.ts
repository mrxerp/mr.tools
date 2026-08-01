import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "mr-compress",
  name: "mr.compress",
  tagline: "Shrink a PDF file size.",
  description: "mr.compress — Shrink a PDF file size. Re-serializes the document, drops unused objects, and picks the most compact object-stream layout. Everything runs in your browser — nothing uploads.",
  tags: ["pdf", "compress", "shrink", "reduce", "size"],
  icon: "compress",
  difficulty: "Medium",
  offline: true,
  related: ["mr-split", "mr-merge"],
};
