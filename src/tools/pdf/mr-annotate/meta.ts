import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "mr-annotate",
  name: "mr.annotate",
  tagline: "Add text notes to PDF pages.",
  description: "mr.annotate - Place text notes at any position on a page of your PDF, with your choice of size and color. Everything runs in your browser - nothing uploads.",
  tags: ["pdf", "annotate", "comment", "text", "note"],
  icon: "annotate",
  difficulty: "Easy",
  offline: true,
  related: ["mr-redact", "mr-form"],
};
