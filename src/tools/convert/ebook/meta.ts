import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "ebook",
  name: "mr ebook",
  tagline: "Read EPUB, reflow to clean HTML/Markdown, export self-contained book.",
  description: "Convert EPUB files to clean HTML or Markdown while preserving chapters, metadata, and structure. Extract text for reading or republishing. Reports broken chapters and missing images. Runs entirely in your browser.",
  tags: ["epub", "ebook", "convert", "html", "markdown", "extract"],
  icon: "file",
  difficulty: "Medium",
  offline: true,
  related: ["docu", "archive"],
};