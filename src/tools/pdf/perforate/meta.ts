import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "perforate",
  name: "mr.perforate",
  tagline: "Cut each PDF page in half.",
  description: "Split every page of a PDF in half - vertically or horizontally - so each source page becomes two pages. Handy for cutting menu cards, labels, and tickets. Everything runs in your browser.",
  tags: ["pdf", "split", "cut", "grid", "perforate", "ticket", "label"],
  icon: "split",
  difficulty: "Medium",
  offline: true,
  related: ["mr-split", "page-wash"],
};
