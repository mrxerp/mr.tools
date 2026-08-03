import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "sql",
  name: "mr.sql",
  tagline: "Format and beautify SQL queries.",
  description: "Format and beautify SQL queries with language support for MySQL, PostgreSQL, and SQLite, plus keyword case and indent controls. Runs entirely in your browser.",
  tags: ["sql", "format", "beautify", "pretty", "mysql", "postgresql", "sqlite"],
  icon: "data",
  difficulty: "Easy",
  offline: true,
  related: ["beautify", "table", "json"],
};
