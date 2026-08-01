import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "pivot",
  name: "mr.pivot",
  tagline: "Build pivot tables: pick rows/columns/values/aggregate, instant grid preview, export CSV/XLSX.",
  description: "Create pivot tables in the browser. Select row fields, column fields, value fields, and aggregation (sum, count, avg, min, max). See the grid instantly and export to CSV or XLSX.",
  tags: ["csv", "pivot", "xlsx", "analytics", "summarize"],
  icon: "table",
  difficulty: "Hard",
  offline: true,
  related: ["merge", "sort", "calc"],
};