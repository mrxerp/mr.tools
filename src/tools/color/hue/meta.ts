import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "hue",
  name: "mr.hue",
  tagline: "Interactive color wheel with EyeDropper, harmonies, and full format conversion.",
  description: "Pick colors from any screen pixel using the EyeDropper API, explore harmonies on an interactive color wheel, and convert between HEX, RGB, HSL, LAB, and OKLCH formats with color names.",
  tags: ["color-picker", "eyedropper", "color-wheel", "conversion", "oklch", "lab", "harmony"],
  icon: "eye",
  difficulty: "Medium",
  offline: true,
  related: ["palette", "gradient", "name", "blend"],
};