import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "table",
  name: "mr.table",
  tagline: "Convert JSON arrays to CSV/Excel and back with nested-field flattening.",
  description: "Convert JSON arrays to CSV/Excel and back, with header guessing, nested-field flattening (dot paths), and null handling.",
  tags: ["json", "csv", "excel", "convert", "flatten", "table"],
  icon: "table",
  difficulty: "Medium",
  offline: true,
  related: ["beautify", "yaml", "toml", "schema"],
};