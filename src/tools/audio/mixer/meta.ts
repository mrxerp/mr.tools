import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "mixer",
  name: "mr.mixer",
  tagline: "Layer two tracks with volume, pan, and fades, then export a mix.",
  description:
    "mr.mixer — Load two audio files, set volume, pan, and fades for each, and export a combined stereo WAV. A pocket two-track mixer that never uploads anything.",
  tags: ["mix", "audio", "mixer", "volume", "fade", "pan", "wav"],
  icon: "sliders",
  difficulty: "Medium",
  offline: true,
  related: ["trim", "vocal"],
};
