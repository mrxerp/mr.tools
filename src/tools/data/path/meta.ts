import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "path",
  name: "mr.path",
  tagline: "Build JSONPath/JSON Pointer expressions by clicking nodes in a JSON tree.",
  description: "Build JSONPath and JSON Pointer expressions visually by clicking nodes in a JSON tree, with copy-ready paths.",
  tags: ["json", "jsonpath", "json-pointer", "path", "query", "tree"],
  icon: "data",
  difficulty: "Easy",
  offline: true,
  related: ["beautify", "grok", "compare"],
};