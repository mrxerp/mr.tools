import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "mr-fade",
  name: "mr.fade",
  tagline: "Check a photo for fading, clipping, and vignette.",
  description: "mr.fade - analyze a photo for fading, blown-out highlights, and vignette with an honest histogram and simple heuristics. Analysis only - it never alters your photo. Everything runs in your browser, nothing uploads.",
  tags: ["image", "fade", "exposure", "analyze"],
  icon: "data",
  difficulty: "Medium",
  offline: true,
  related: ["mr-convert", "mr-resize"],
};
