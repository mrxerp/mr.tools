import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "split",
  name: "mr.split",
  tagline: "Split CSV/XLSX into many files by column value or row count, with zip download.",
  description: "Split a spreadsheet into multiple files by a column's unique values (e.g., per region, per month) or by fixed row count. Download all parts as a ZIP archive.",
  tags: ["csv", "split", "xlsx", "batch", "zip"],
  icon: "split",
  difficulty: "Medium",
  offline: true,
  related: ["merge", "stitch", "clean"],
};