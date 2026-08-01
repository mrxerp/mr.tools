import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "yaml",
  name: "mr.yaml",
  tagline: "Validate/lint YAML with error positions, JSON↔YAML conversion with quoting-safety warnings.",
  description: "Validate and lint YAML with detailed error positions, plus JSON↔YAML conversion both ways with quoting-safety warnings.",
  tags: ["yaml", "validate", "lint", "convert", "json", "quoting"],
  icon: "data",
  difficulty: "Medium",
  offline: true,
  related: ["toml", "beautify", "compare", "yaml2doc"],
};