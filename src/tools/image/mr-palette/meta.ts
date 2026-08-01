import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "mr-palette",
  name: "mr.palette",
  tagline: "Extract a dominant-color palette from any image.",
  description: "mr.palette — extract the dominant colors from an image as a swatch with hex codes and per-color share, ready to copy. Everything runs in your browser, nothing uploads.",
  tags: ["image", "palette", "color", "extract"],
  icon: "eye",
  difficulty: "Medium",
  offline: true,
  related: ["mr-resize", "mr-crop"],
};
