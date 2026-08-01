import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "excel",
  name: "mr.excel",
  tagline: "Convert XLSX/CSV ↔ JSON with per-column type settings and auto-typing.",
  description: "Convert between spreadsheet formats and JSON. Choose per-column types (string, number, boolean, date), auto-detect types, and export with basic styling. Uses SheetJS for full XLSX support.",
  tags: ["csv", "xlsx", "json", "convert", "sheetjs"],
  icon: "convert",
  difficulty: "Medium",
  offline: true,
  related: ["clean", "merge", "split"],
};