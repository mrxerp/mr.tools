import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "regex",
  name: "mr.regex",
  tagline: "Build regex visually from sample strings: highlight matches, explain tokens, generate recipes.",
  description: "mr.regex - Sample-driven regex builder. Paste a string, highlight matches live, get token explanations, and generate common pattern recipes. All local, no server.",
  tags: ["regex", "regular expression", "pattern", "builder", "generator", "sample"],
  icon: "search",
  difficulty: "Medium",
  offline: true,
  related: ["encode", "json"],
};