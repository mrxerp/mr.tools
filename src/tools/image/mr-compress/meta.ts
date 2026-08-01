import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "mr-compress",
  name: "mr.compress",
  tagline: "Shrink an image file size.",
  description: "mr.compress — Shrink an image file size by re-encoding at a lower quality. Everything runs in your browser, nothing uploads.",
  tags: ["image", "compress", "shrink", "size", "quality"],
  icon: "compress",
  difficulty: "Easy",
  offline: true,
  related: ["mr-convert", "mr-resize"],
};
