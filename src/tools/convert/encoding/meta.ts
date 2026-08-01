import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "encoding",
  name: "mr encoding",
  tagline: "Detect text encoding (UTF-8, UTF-16, Latin-1, Shift-JIS), convert to UTF-8, repair mojibake.",
  description: "Detect a text file's encoding from byte patterns, convert to UTF-8, and repair classic mojibake with before/after diff. Supports UTF-8, UTF-16, Latin-1, Shift-JIS, and more. Runs entirely in your browser.",
  tags: ["encoding", "utf8", "utf16", "latin1", "shift-jis", "mojibake", "detect", "convert", "repair"],
  icon: "text",
  difficulty: "Medium",
  offline: true,
  related: ["docu", "ebook"],
};