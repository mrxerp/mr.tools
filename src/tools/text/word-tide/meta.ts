import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "word-tide",
  name: "mr.word tide",
  tagline: "Live writing stats - word count, reading time, and readability scores.",
  description: "mr.word tide - Word, character, and sentence counts, reading and speaking time, and Flesch and Gunning Fog readability scores, updating live as you type.",
  tags: ["count", "stats", "readability", "flesch", "gunning-fog", "words"],
  icon: "calc",
  difficulty: "Easy",
  offline: true,
  related: ["case", "diff", "syllables"],
};
