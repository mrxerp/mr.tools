import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "mr-form",
  name: "mr.form",
  tagline: "Fill PDF forms with text.",
  description: "mr.form - Detect the fields in your PDF form and fill them in, all in your browser. Text fields, checkboxes, radio buttons, and dropdowns are supported - nothing uploads.",
  tags: ["pdf", "form", "fill", "fields", "pdf form"],
  icon: "form",
  difficulty: "Medium",
  offline: true,
  related: ["mr-sign", "mr-annotate"],
};
