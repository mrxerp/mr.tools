import { strictEqual, ok } from "node:assert";
import { formatSql } from "./tool.ts";

export async function runTest() {
  const upper = formatSql("select a,b from t where x=1", { language: "sql" });
  ok(upper.includes("\n"), "output contains a newline");
  ok(upper.includes("SELECT"), "keywords uppercased by default");

  const lower = formatSql("select a,b from t where x=1", { keywordCase: "lower" });
  ok(lower.includes("select"), "keywordCase lower produces lowercase");

  const indent4 = formatSql("select a,b from t where x=1", { indent: "    " });
  ok(indent4.split("\n")[1].startsWith("    "), "indent option respected");

  const tabIndent = formatSql("select a,b from t where x=1", { indent: "\t" });
  ok(tabIndent.split("\n")[1].startsWith("\t"), "tab indent respected");

  strictEqual(formatSql("   "), "", "whitespace-only input returns empty string");
  strictEqual(formatSql(""), "", "empty input returns empty string");

  const sqlite = formatSql("select * from t", { language: "sqlite" });
  ok(sqlite.length > 0, "sqlite language accepted without throwing");

  const preserve = formatSql("SELECT a FROM t", { keywordCase: "preserve" });
  ok(preserve.includes("SELECT"), "preserve keeps original case");

  const postgres = formatSql("select a from t", { language: "postgresql" });
  ok(postgres.includes("SELECT"), "postgresql language works");
}
