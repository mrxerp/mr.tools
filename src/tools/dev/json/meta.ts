import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "json",
  name: "mr.json",
  tagline: "Filter, query, and transform JSON with JSONPath, table view, and CSV export.",
  description: "mr.json - JSON filter and query tool with JSONPath subset support, interactive table view, and JSON to CSV export. Process JSON locally without sending data anywhere.",
  tags: ["json", "jsonpath", "query", "filter", "csv", "transform", "table"],
  icon: "data",
  difficulty: "Medium",
  offline: true,
  related: ["encode", "csv"],
};