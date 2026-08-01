import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "docu",
  name: "mr docu",
  tagline: "Extract DOCX/RTF → clean Markdown/HTML (headings, tables, lists, links, images).",
  description: "Extract DOCX or legacy RTF into clean Markdown or HTML — headings, tables, lists, and links preserved, images extracted — for republishing into CMSes, wikis, and static sites. Unzips DOCX via Compression Streams, parses with DOMParser. Runs entirely in your browser.",
  tags: ["docx", "rtf", "markdown", "html", "extract", "convert", "cms", "publish"],
  icon: "file",
  difficulty: "Medium",
  offline: true,
  related: ["ebook", "encoding", "archive"],
};