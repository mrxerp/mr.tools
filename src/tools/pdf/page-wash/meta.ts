import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "page-wash",
  name: "mr.page wash",
  tagline: "Blank out chosen pages of a PDF.",
  description: "Scrub pages of a PDF before sharing — replace chosen pages with blank ones and keep the rest. Everything runs in your browser.",
  tags: ["pdf", "wash", "scrub", "blank", "redact", "pages"],
  icon: "redact",
  difficulty: "Medium",
  offline: true,
  related: ["mr-split", "perforate"],
};
