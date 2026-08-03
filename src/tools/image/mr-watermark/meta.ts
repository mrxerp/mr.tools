import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "mr-watermark",
  name: "mr.watermark",
  tagline: "Watermark a batch of images with text or a logo.",
  description: "mr.watermark - overlay a text or image watermark on many images at once, with position, size, and opacity controls, then download each result. Everything runs in your browser, nothing uploads.",
  tags: ["image", "watermark", "batch", "logo"],
  icon: "sign",
  difficulty: "Medium",
  offline: true,
  related: ["mr-convert", "mr-resize"],
};
