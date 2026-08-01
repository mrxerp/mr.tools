import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "cal",
  name: "mr cal",
  tagline: "Convert CSV/Excel event lists → .ics calendar. Merge, dedupe, parse recurring rules.",
  description: "Convert CSV or Excel event lists into .ics calendar files. Merge multiple calendars, deduplicate overlapping events, and parse recurring rules into real repeating events. Uses SheetJS for Excel reading. Runs entirely in your browser.",
  tags: ["calendar", "ics", "csv", "excel", "xlsx", "convert", "merge", "dedupe", "recurring"],
  icon: "clock",
  difficulty: "Medium",
  offline: true,
  related: ["contact", "encoding"],
};