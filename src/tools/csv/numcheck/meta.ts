import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "numcheck",
  name: "mr.numcheck",
  tagline: "Validate and fix numeric cells: find non-numeric in numeric columns, normalize currency/percent, report anomalies.",
  description: "Scan CSV/XLSX for numeric data quality issues. Detect non-numeric values in numeric columns, normalize currency and percent formats, identify outliers, and export a clean version with a detailed anomaly report.",
  tags: ["csv", "numbers", "validate", "clean", "finance", "audit"],
  icon: "calc",
  difficulty: "Easy",
  offline: true,
  related: ["clean", "lint", "calc"],
};