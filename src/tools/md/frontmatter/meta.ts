import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "frontmatter",
  name: "mr.frontmatter",
  tagline: "Validate/repair YAML front matter in markdown files (dates, slugs, tags).",
  description: "mr.frontmatter - Validate and repair YAML front matter in markdown files. Fix dates, slugs, tags, and rename files to match slugs. Batch process folders via File System Access API.",
  tags: ["frontmatter", "yaml", "markdown", "validate", "repair", "hugo", "jekyll", "astro"],
  icon: "form",
  difficulty: "Easy",
  offline: true,
  related: ["anchor", "lint", "doc"],
};