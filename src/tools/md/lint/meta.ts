import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "lint",
  name: "mr.lint",
  tagline: "Markdown linter: heading hierarchy, line length, trailing spaces, link validity.",
  description: "mr.lint - Lint markdown for heading hierarchy, line length, trailing spaces, link validity, and more. Auto-fix suggestions included.",
  tags: ["lint", "markdown", "validate", "heading", "links", "style"],
  icon: "check",
  difficulty: "Medium",
  offline: true,
  related: ["frontmatter", "anchor", "footnote"],
};