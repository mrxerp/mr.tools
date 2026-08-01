import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "beautify",
  name: "mr.beautify",
  tagline: "Format, minify, validate, and sort JSON with tree/table views.",
  description: "Format, minify, validate, and sort JSON with tree/table views, key-path copying, and error line highlighting.",
  tags: ["json", "format", "beautify", "minify", "validate", "sort", "tree", "table"],
  icon: "data",
  difficulty: "Easy",
  offline: true,
  related: ["lint", "path", "compare", "grok"],
};