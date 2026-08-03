import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "chords",
  name: "mr.chords",
  tagline: "Find chord voicings for guitar and ukulele from a root and quality.",
  description:
    "mr.chords - Pick a root and chord quality and get its notes plus a suggested guitar or ukulele voicing, with a playable preview and printable chart. Built from note math, entirely in your browser.",
  tags: ["chords", "guitar", "ukulele", "music", "notes", "audio"],
  icon: "key",
  difficulty: "Medium",
  offline: true,
  related: ["tone", "bpm"],
};
