import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "regex",
  name: "mr.regex",
  tagline: "Test a regular expression live — matches, capture groups, replace preview.",
  description: "mr.regex — Build and test regular expressions with live match lists, capture groups, and a replace preview. Everything runs offline in your browser.",
  tags: ["regex", "regular expression", "match", "test", "replace"],
  icon: "code",
  difficulty: "Medium",
  offline: true,
  related: ["diff", "word-salad"],
};
