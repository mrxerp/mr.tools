import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "anchor",
  name: "mr.anchor",
  tagline: "Generate anchor links, heading links, TOC from pasted markdown.",
  description: "mr.anchor — Generate GitHub-flavored anchor links, heading links, and a TOC from pasted markdown with scroll-to-section preview.",
  tags: ["anchor", "heading", "toc", "scroll", "markdown"],
  icon: "link",
  difficulty: "Easy",
  offline: true,
  related: ["doc", "frontmatter", "lint"],
};