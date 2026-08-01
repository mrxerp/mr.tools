import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "stitch",
  name: "mr.stitch",
  tagline: "Combine sheets from multiple XLSX workbooks into one with merged formatting and name-based tab lookup.",
  description: "Merge multiple spreadsheet files into a single workbook. Automatically align sheets by name, combine columns, and preserve formatting. Perfect for monthly reports, consolidated datasets, and multi-source aggregations.",
  tags: ["csv", "xlsx", "merge", "combine", "multi-sheet", "workbook"],
  icon: "compress",
  difficulty: "Medium",
  offline: true,
  related: ["merge", "split", "excel"],
};