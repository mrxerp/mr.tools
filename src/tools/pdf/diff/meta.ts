import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "diff",
  name: "mr.diff",
  tagline: "Compare two PDFs side by side.",
  description: "Render two versions of a PDF page by page and highlight every changed region as a pixel diff - a visual, side-by-side comparison that runs entirely in your browser.",
  tags: ["pdf", "diff", "compare", "visual", "side-by-side"],
  icon: "eye",
  difficulty: "Hard",
  offline: true,
  related: ["mr-convert", "page-wash"],
};
