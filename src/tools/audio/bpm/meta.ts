import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "bpm",
  name: "mr.bpm",
  tagline: "Find a track's tempo with onset detection, or tap it in by hand.",
  description:
    "mr.bpm - Load a track and estimate its BPM locally using simple energy-onset detection, or tap the beat with a button for a manual tempo. The audio never leaves your device.",
  tags: ["bpm", "tempo", "beats", "beat", "tap", "audio"],
  icon: "clock",
  difficulty: "Medium",
  offline: true,
  related: ["tone", "chords"],
};
