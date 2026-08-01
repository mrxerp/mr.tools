import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "mr-unlock",
  name: "mr.unlock",
  tagline: "Remove a PDF's password and unlock it.",
  description: "Remove a PDF's password and unlock it. Everything runs in your browser.",
  tags: ["pdf", "unlock", "password", "decrypt"],
  icon: "unlock",
  difficulty: "Easy",
  offline: true,
  related: ["mr-convert"],
};
