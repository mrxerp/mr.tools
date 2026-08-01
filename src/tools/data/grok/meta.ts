import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "grok",
  name: "mr.grok",
  tagline: "Collapse huge JSON/XML into a navigable outline with chunked paging for large files.",
  description: "Collapse huge JSON/XML into a queryable, navigable outline with JSONata-style expression evaluation and chunked paging for very large files.",
  tags: ["json", "xml", "outline", "navigate", "query", "jsonata", "large", "paging"],
  icon: "data",
  difficulty: "Medium",
  offline: true,
  related: ["beautify", "path", "compare", "schema"],
};