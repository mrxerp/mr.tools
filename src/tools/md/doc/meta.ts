import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "doc",
  name: "mr.doc",
  tagline: "Markdown → styled DOCX/PDF via in-browser rendering with template themes.",
  description: "mr.doc — Convert markdown to professional DOCX or PDF documents with template themes. Uses docx.js for DOCX and pdf-lib for PDF generation. Everything runs locally in your browser.",
  tags: ["markdown", "docx", "pdf", "convert", "document", "template"],
  icon: "file",
  difficulty: "Hard",
  offline: true,
  related: ["sink", "frontmatter", "anchor"],
};