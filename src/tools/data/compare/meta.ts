import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "compare",
  name: "mr.compare",
  tagline: "Side-by-side JSON/XML/YAML comparison with structural and literal diff modes.",
  description: "Side-by-side JSON/XML/YAML comparison with structural (key-order-insensitive) and literal diff modes.",
  tags: ["json", "xml", "yaml", "diff", "compare", "structural", "literal"],
  icon: "data",
  difficulty: "Medium",
  offline: true,
  related: ["beautify", "yaml", "xml", "grok"],
};