import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "sort",
  name: "mr.sort",
  tagline: "Multi-key sort, filter builder, and column reorder with instant grid preview and export.",
  description: "Sort and filter spreadsheet data by multiple columns. Add filters to show only matching rows, reorder columns for better visibility, see a live preview, and export the result.",
  tags: ["csv", "xlsx", "sort", "filter", "column", "reorder"],
  icon: "arrow",
  difficulty: "Medium",
  offline: true,
  related: ["clean", "pivot", "calc"],
};