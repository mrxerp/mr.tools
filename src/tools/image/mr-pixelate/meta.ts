import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "mr-pixelate",
  name: "mr.pixelate",
  tagline: "Pixelate any image with an adjustable block size.",
  description: "mr.pixelate - pixelate an image by averaging blocks of pixels, with an adjustable block size and an optional mosaic grid overlay. Everything runs in your browser, nothing uploads.",
  tags: ["image", "pixelate", "mosaic", "pixel"],
  icon: "hash",
  difficulty: "Medium",
  offline: true,
  related: ["mr-resize", "mr-dither"],
};
