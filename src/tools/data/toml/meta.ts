import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "toml",
  name: "mr.toml",
  tagline: "Validate, format, and convert TOML↔JSON/YAML with comments-preserved formatting.",
  description: "Validate, format, and convert TOML to JSON/YAML and back, with comments-preserved formatting.",
  tags: ["toml", "validate", "format", "convert", "json", "yaml", "comments"],
  icon: "data",
  difficulty: "Medium",
  offline: true,
  related: ["yaml", "beautify", "table", "yaml2doc"],
};