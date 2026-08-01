import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "diff",
  name: "mr.diff",
  tagline: "Compare two texts — line-level and character-level diff.",
  description: "mr.diff — Paste two versions of a text and see the changes as a color-coded line diff with character-level highlighting. Nothing leaves your browser.",
  tags: ["diff", "compare", "lines", "characters", "version"],
  icon: "split",
  difficulty: "Easy",
  offline: true,
  related: ["case", "word-tide"],
};
