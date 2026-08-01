import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "merge",
  name: "mr.merge",
  tagline: "Concatenate multiple CSV/XLSX files with header detection, key-based union/intersect, and deduping.",
  description: "Merge multiple spreadsheets into one. Automatically detects matching headers, supports union/intersect on key columns, and removes duplicates by key. Export as CSV or XLSX.",
  tags: ["csv", "merge", "xlsx", "combine", "join", "dedupe"],
  icon: "merge",
  difficulty: "Medium",
  offline: true,
  related: ["split", "stitch", "clean"],
};