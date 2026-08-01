import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "scraper",
  name: "mr.scraper",
  tagline: "Convert messy pasted web text (articles, emails) → clean markdown.",
  description: "mr.scraper — Paste messy web text and get clean markdown: strips junk, fixes line breaks, normalizes headings and quotes. Pure cleaning logic.",
  tags: ["scraper", "clean", "markdown", "web", "text", "readability"],
  icon: "annotate",
  difficulty: "Medium",
  offline: true,
  related: ["lint", "sink", "footnote"],
};