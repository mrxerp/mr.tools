import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "calc",
  name: "mr.calc",
  tagline: "Apply formulas to whole columns: sum, avg, pct-change, increment, string ops — with live preview.",
  description: "Calculate new columns from existing data. Apply math (sum, average, percent change, increment), string operations (concat, replace, slice), and date operations. See a live preview column before exporting.",
  tags: ["csv", "calculate", "formula", "math", "string", "transform"],
  icon: "sliders",
  difficulty: "Easy",
  offline: true,
  related: ["clean", "numcheck", "sort"],
};