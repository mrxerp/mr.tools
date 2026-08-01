import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "formal",
  name: "mr.formal",
  tagline: "Rewrite chatty text into formal business tone — rules only, no AI.",
  description: "mr.formal — Turn casual text more formal with deterministic rules: expand contractions, swap common slang, and fix capitalization. An honest, offline rules-based rephraser — not a tone judge.",
  tags: ["formal", "professional", "contractions", "rewrite", "tone"],
  icon: "convert",
  difficulty: "Medium",
  offline: true,
  related: ["case", "bleep"],
};
