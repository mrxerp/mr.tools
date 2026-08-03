import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "mr-resize",
  name: "mr.resize",
  tagline: "Resize an image to exact dimensions.",
  description: "mr.resize - Resize an image to exact pixel dimensions. Everything runs in your browser, nothing uploads.",
  tags: ["image", "resize", "scale", "dimensions"],
  icon: "image",
  difficulty: "Easy",
  offline: true,
  related: ["mr-convert", "mr-crop"],
};
