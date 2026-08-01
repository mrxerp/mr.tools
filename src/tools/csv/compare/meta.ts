import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "compare",
  name: "mr.compare",
  tagline: "Diff two spreadsheets cell-by-cell with color-coded grid and discrepancy report.",
  description: "Compare two CSV or XLSX files cell-by-cell. See a color-coded overlay grid showing matches, mismatches, and missing cells. Export a detailed discrepancy report.",
  tags: ["csv", "compare", "diff", "xlsx", "audit"],
  icon: "wrench",
  difficulty: "Medium",
  offline: true,
  related: ["merge", "clean", "lint"],
};