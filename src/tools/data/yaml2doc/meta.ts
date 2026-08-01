import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "yaml2doc",
  name: "mr.yaml2doc",
  tagline: "Render YAML/JSON/TOML configs as readable documentation cards with typed tables.",
  description: "Render YAML/JSON/TOML config files as readable documentation cards (typed tables, defaults, descriptions from comments) for pasting into docs.",
  tags: ["yaml", "json", "toml", "documentation", "render", "config", "docs"],
  icon: "data",
  difficulty: "Medium",
  offline: true,
  related: ["yaml", "toml", "schema", "beautify"],
};