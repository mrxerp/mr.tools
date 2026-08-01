import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "escape",
  name: "mr.escape",
  tagline: "Escape/unescape strings for JSON, XML, HTML, SQL, shell, and URLs with preview.",
  description: "Escape and unescape strings for JSON, XML, HTML, SQL, shell, and URLs, with a per-format escape preview panel.",
  tags: ["escape", "unescape", "json", "xml", "html", "sql", "shell", "url"],
  icon: "data",
  difficulty: "Easy",
  offline: true,
  related: ["beautify", "yaml", "xml"],
};