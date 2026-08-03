import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "mr-convert",
  name: "mr.convert",
  tagline: "Convert an image between PNG, JPEG, and WebP.",
  description: "mr.convert - Convert an image between PNG, JPEG, and WebP. Everything runs in your browser, nothing uploads.",
  tags: ["image", "convert", "png", "jpeg", "webp"],
  icon: "convert",
  difficulty: "Easy",
  offline: true,
  related: ["mr-compress", "mr-resize"],
};
