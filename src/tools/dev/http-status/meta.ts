import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "http-status",
  name: "mr.http-status",
  tagline: "Look up HTTP status codes by number or keyword.",
  description: "Look up HTTP status codes by number or keyword, with names, meanings, and 1xx through 5xx category filtering. Fully offline and instant.",
  tags: ["http", "status", "status codes", "api", "reference", "developer"],
  icon: "search",
  difficulty: "Easy",
  offline: true,
  related: ["url", "json"],
};
