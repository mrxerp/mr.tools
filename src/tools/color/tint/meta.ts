import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "tint",
  name: "mr.tint",
  tagline: "Generate perceptually-even UI color scales (50–950) from a base hue using OKLCH.",
  description: "Create design-system-ready color scales with perceptual evenness. Generate 50-950 shades from any base color using OKLCH color space for consistent lightness steps. Export as CSS variables, SCSS, or Tailwind config.",
  tags: ["color-scale", "design-system", "oklch", "tint", "shade", "tailwind", "css"],
  icon: "palette",
  difficulty: "Medium",
  offline: true,
  related: ["palette", "css", "gradient", "safe"],
};