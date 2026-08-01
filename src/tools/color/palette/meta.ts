import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "palette",
  name: "mr.palette",
  tagline: "Generate harmonious palettes from a seed color with lockable swatches.",
  description: "Create color palettes using color theory: analogous, complementary, triadic, tetradic, and monochromatic. Lock swatches, shuffle, and export as CSS, SCSS, Tailwind config, or PNG.",
  tags: ["palette", "color-scheme", "harmony", "design", "tailwind", "css"],
  icon: "palette",
  difficulty: "Easy",
  offline: true,
  related: ["contrast", "gradient", "tint", "css"],
};