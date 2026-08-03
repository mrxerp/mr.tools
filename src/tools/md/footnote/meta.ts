import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "footnote",
  name: "mr.footnote",
  tagline: "Re-number markdown footnotes, dedupe definitions, convert inline↔reference links.",
  description: "mr.footnote - Automatically re-number markdown footnotes, deduplicate definitions, and convert between inline and reference link styles. Pure logic, no dependencies.",
  tags: ["footnote", "markdown", "renumber", "dedupe", "links", "academic"],
  icon: "hash",
  difficulty: "Medium",
  offline: true,
  related: ["lint", "scraper", "bib"],
};