import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "tone",
  name: "mr.tone",
  tagline: "Generate test tones, sweeps, beats, and noise for speakers and ears.",
  description:
    "mr.tone — Generate sine, square, triangle, and sawtooth tones, frequency sweeps, beat patterns, and noise from a reference frequency or note name. Handy for speaker checks and hearing tests. Runs fully in your browser.",
  tags: ["tone", "generator", "frequency", "sweep", "noise", "audio"],
  icon: "sliders",
  difficulty: "Easy",
  offline: true,
  related: ["bpm", "chords"],
};
