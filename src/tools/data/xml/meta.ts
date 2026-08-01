import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "xml",
  name: "mr.xml",
  tagline: "Format, validate against XSD, and transform XML with XSLT in the browser.",
  description: "Format, basic XSD validation, and XSLT transform XML in the browser using DOMParser and XSLTProcessor.",
  tags: ["xml", "format", "xsd", "validate", "xslt", "transform"],
  icon: "data",
  difficulty: "Hard",
  offline: true,
  related: ["compare", "beautify", "grok"],
};