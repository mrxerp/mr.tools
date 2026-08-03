import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "clean",
  name: "mr.clean",
  tagline: "Clean CSV: trim whitespace, dedupe rows, fix line endings, normalize delimiters.",
  description: "Clean up messy CSV files - trim whitespace, remove duplicate rows, fix line endings, normalize delimiters and quoting. See a preview and a 'what I changed' log before downloading.",
  tags: ["csv", "clean", "fix", "dedupe", "normalize"],
  icon: "wrench",
  difficulty: "Easy",
  offline: true,
  related: ["lint", "split", "merge"],
};