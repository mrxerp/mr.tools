import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "table",
  name: "mr.table",
  tagline: "Build markdown tables visually — spreadsheet-like grid emits pipe-format markdown.",
  description: "mr.table — A visual markdown table builder with a spreadsheet-like grid. Handles alignment, merged content, and pasted CSV/Excel. Everything runs in your browser.",
  tags: ["markdown", "table", "csv", "spreadsheet", "pipe-format"],
  icon: "table",
  difficulty: "Easy",
  offline: true,
  related: ["csv", "diff", "lint"],
};