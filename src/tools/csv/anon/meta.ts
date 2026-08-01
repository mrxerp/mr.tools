import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "anon",
  name: "mr.anon",
  tagline: "Detect and mask PII in CSVs/XLSX — emails, phones, names, IDs — with realistic fakes for testing.",
  description: "Anonymize personal data in spreadsheets. Detect emails, phone numbers, names, IDs, and custom patterns. Replace with realistic fakes while preserving data structure. Save column profiles for repeat use.",
  tags: ["csv", "xlsx", "anonymize", "pii", "privacy", "masking", "gdpr"],
  icon: "redact",
  difficulty: "Medium",
  offline: true,
  related: ["clean", "lint", "split"],
};