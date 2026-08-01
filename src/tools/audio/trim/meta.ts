import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "trim",
  name: "mr.trim",
  tagline: "Trim and fade an audio file with a waveform preview, then export WAV.",
  description:
    "mr.trim — Load an audio file, watch its waveform, pick start and end points, add fades, and export the trimmed clip as a WAV. Everything runs in your browser, nothing uploads.",
  tags: ["trim", "cut", "audio", "waveform", "edit", "wav"],
  icon: "split",
  difficulty: "Medium",
  offline: true,
  related: ["mixer", "vocal"],
};
