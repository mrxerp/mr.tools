import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "contrast",
  name: "mr.contrast",
  tagline: "WCAG contrast ratio checker with live pair preview and fix suggestions.",
  description: "Check contrast ratios against WCAG AA/AAA for text and UI components. Includes a live preview and a palette fixer that suggests accessible alternatives.",
  tags: ["contrast", "wcag", "accessibility", "a11y", "color"],
  icon: "eye",
  difficulty: "Easy",
  offline: true,
  related: ["palette", "safe", "blind"],
};