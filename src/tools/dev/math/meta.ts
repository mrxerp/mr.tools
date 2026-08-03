import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "math",
  name: "mr.math",
  tagline: "Evaluate math expressions safely, right in your browser.",
  description: "mr.math - Evaluate arithmetic and math expressions safely in the browser with a hand-rolled parser. Supports +, -, *, /, ^, %, parentheses, unary signs, common functions like sqrt, log, min, and max, plus the constants pi and e. No eval, no network - your expression never leaves the page.",
  tags: ["math", "calculator", "arithmetic", "expression", "evaluate", "parser"],
  icon: "calc",
  difficulty: "Medium",
  offline: true,
  related: ["percent", "hash", "regex"],
};
