import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "blind",
  name: "mr.blind",
  tagline: "Simulate color vision deficiency (protanopia, deuteranopia, tritanopia) on images and palettes.",
  description: "Test your designs for color blindness accessibility. Simulate protanopia, deuteranopia, and tritanopia on uploaded images or color palettes. Flag risky color pairs that fail accessibility standards.",
  tags: ["color-blind", "accessibility", "cvd", "protanopia", "deuteranopia", "tritanopia", "simulation"],
  icon: "eye",
  difficulty: "Medium",
  offline: true,
  related: ["contrast", "palette", "safe"],
};