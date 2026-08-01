import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "mr-split",
  name: "mr.split",
  tagline: "Split a PDF into one file per page.",
  description: "Split a PDF into separate files — one per page, in groups, or by page ranges. Everything runs in your browser.",
  tags: ["pdf", "split", "pages", "ranges"],
  icon: "split",
  difficulty: "Easy",
  offline: true,
  related: ["mr-merge", "mr-convert"],
};
