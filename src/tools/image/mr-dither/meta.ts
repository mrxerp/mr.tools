import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "mr-dither",
  name: "mr.dither",
  tagline: "Apply ordered or Floyd-Steinberg dithering to an image.",
  description: "mr.dither - apply 1-bit or 2-bit ordered (Bayer) or Floyd-Steinberg dithering to any image for a lo-fi, pixel-art look. Everything runs in your browser, nothing uploads.",
  tags: ["image", "dither", "pixel", "halftone"],
  icon: "dice",
  difficulty: "Medium",
  offline: true,
  related: ["mr-glitch", "mr-pixelate"],
};
