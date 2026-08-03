import { format } from "sql-formatter";

export interface SqlFormatOptions {
  language?: "sql" | "mysql" | "postgresql" | "sqlite";
  keywordCase?: "upper" | "lower" | "preserve";
  indent?: string;
}

export function formatSql(sql: string, opts: SqlFormatOptions = {}): string {
  if (!sql.trim()) return "";
  const indent = opts.indent ?? "  ";
  return format(sql, {
    language: opts.language ?? "sql",
    keywordCase: opts.keywordCase ?? "upper",
    ...(indent.includes("\t") ? { useTabs: true } : { tabWidth: indent.length }),
  });
}
