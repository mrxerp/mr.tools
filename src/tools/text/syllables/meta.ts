import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "syllables",
  name: "mr.syllables",
  tagline: "Split words into syllables and count them, for any text.",
  description: "mr.syllables — Split English words into syllables with heuristic rules and a small exception list, then count syllables across whole paragraphs for poems, lyrics, and pronunciation practice.",
  tags: ["syllables", "split", "count", "poetry", "pronunciation"],
  icon: "hash",
  difficulty: "Medium",
  offline: true,
  related: ["word-tide", "case"],
};
