import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "mr-redact",
  name: "mr.redact",
  tagline: "Black out text in a PDF.",
  description: "mr.redact - Paint opaque ink over regions of your PDF pages. Preview pages with pdf.js and drag to mark areas. Everything runs in your browser - nothing uploads.",
  tags: ["pdf", "redact", "blackout", "hide", "sensitive"],
  icon: "redact",
  difficulty: "Medium",
  offline: true,
  related: ["mr-annotate", "mr-sign"],
};
