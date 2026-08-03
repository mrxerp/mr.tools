import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "mr-crop",
  name: "mr.crop",
  tagline: "Crop an image to a rectangle.",
  description: "mr.crop - Crop an image to a rectangle, with free or preset aspect ratios. Everything runs in your browser, nothing uploads.",
  tags: ["image", "crop", "cut", "aspect"],
  icon: "sliders",
  difficulty: "Medium",
  offline: true,
  related: ["mr-resize", "mr-convert"],
};
