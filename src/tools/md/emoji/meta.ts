import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "emoji",
  name: "mr.emoji",
  tagline: 'Convert emoji shortcodes (":rocket:") ↔ unicode, searchable library.',
  description: "mr.emoji - Bidirectional emoji shortcode to unicode converter with a searchable library. Paste markdown with shortcodes or unicode and convert instantly.",
  tags: ["emoji", "shortcode", "unicode", "markdown", "convert"],
  icon: "palette",
  difficulty: "Easy",
  offline: true,
  related: ["table", "lint", "scraper"],
};