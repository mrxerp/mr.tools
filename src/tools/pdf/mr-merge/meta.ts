import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "mr-merge",
  name: "mr.merge",
  tagline: "Join two or more PDFs into one file.",
  description: "Join two or more PDFs into a single document. Everything runs in your browser.",
  tags: ["pdf", "merge", "combine", "join"],
  icon: "merge",
  difficulty: "Easy",
  offline: true,
  related: ["mr-split", "mr-convert"],
};
