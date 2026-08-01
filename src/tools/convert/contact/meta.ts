import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "contact",
  name: "mr contact",
  tagline: "Convert spreadsheet/CSV → individual .vcf vCard files (or merged). Validate, dedupe.",
  description: "Convert a spreadsheet or CSV of names and contact fields into individual .vcf vCard files or one merged file. Validates phone and email fields, deduplicates contacts before export. Runs entirely in your browser.",
  tags: ["vcf", "vcard", "contact", "csv", "spreadsheet", "convert", "validate", "dedupe", "export"],
  icon: "data",
  difficulty: "Easy",
  offline: true,
  related: ["cal", "encoding"],
};