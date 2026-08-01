import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "css",
  name: "mr.css",
  tagline: "Convert images or hex lists to CSS variables, SCSS maps, and Tailwind configs.",
  description: "Upload an image or paste a list of hex colors to generate ready-to-use CSS variables, SCSS maps, and Tailwind configuration. Includes live sample components for preview.",
  tags: ["css", "scss", "tailwind", "palette", "extraction", "variables"],
  icon: "palette",
  difficulty: "Easy",
  offline: true,
  related: ["palette", "gradient", "contrast"],
};