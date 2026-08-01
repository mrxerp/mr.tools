import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "lint",
  name: "mr.lint",
  tagline: "Validate JSON with error positions and suggestions.",
  description: "Validate JSON with detailed error positions and suggestions for fixing common issues.",
  tags: ["json", "lint", "validate", "error", "suggest"],
  icon: "data",
  difficulty: "Easy",
  offline: true,
  related: ["beautify", "schema", "compare"],
};