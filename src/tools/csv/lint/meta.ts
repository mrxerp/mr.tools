import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "lint",
  name: "mr.lint",
  tagline: "CSV syntax validator: detect malformed rows, inconsistent columns, quoting errors, with line numbers.",
  description: "Validate CSV syntax and structure. Check for consistent column counts, proper quoting, escaped quotes, and well-formed rows. Export a detailed lint report with line numbers and suggested fixes.",
  tags: ["csv", "lint", "validate", "syntax", "quality"],
  icon: "check",
  difficulty: "Easy",
  offline: true,
  related: ["clean", "excel", "merge"],
};