import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "mr-glitch",
  name: "mr.glitch",
  tagline: "RGB-split glitch and scanline effects, seeded and reproducible.",
  description: "mr.glitch — apply channel-shift, scanline-slice, and random-displacement glitch effects to any image. Effects are seeded, so the same settings always reproduce the same glitch. Everything runs in your browser, nothing uploads.",
  tags: ["image", "glitch", "rgb", "effect"],
  icon: "sliders",
  difficulty: "Easy",
  offline: true,
  related: ["mr-dither", "mr-pixelate"],
};
