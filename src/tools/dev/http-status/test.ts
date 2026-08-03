import { strictEqual, ok } from "node:assert";
import { STATUS_CODES, lookup, search } from "./tool.ts";

export async function runTest() {
  strictEqual(lookup(200)?.name, "OK");
  strictEqual(lookup("200")?.name, "OK");
  strictEqual(lookup("404")?.name, "Not Found");
  strictEqual(lookup(418)?.name, "I'm a teapot");
  strictEqual(lookup(599), undefined, "unknown code yields undefined");
  strictEqual(lookup("abc"), undefined, "non-numeric string yields undefined");
  strictEqual(lookup(""), undefined);

  const redir = search("redir");
  ok(redir.length > 0, "redir search has matches");
  ok(redir.every((s) => s.category === "3xx"), "redir search returns only 3xx codes");

  const teapot = search("teapot");
  ok(teapot.some((s) => s.code === 418), "teapot search includes 418");

  const cats = new Set(STATUS_CODES.map((s) => s.category));
  strictEqual(cats.size, 5, "all five categories present");

  strictEqual(STATUS_CODES.length, 54, "all documented codes present");
  for (const s of STATUS_CODES) {
    ok(s.name.length > 0, `name for ${s.code}`);
    ok(s.meaning.length > 0, `meaning for ${s.code}`);
    ok(lookup(s.code) === s, `lookup(${s.code}) round-trips`);
  }

  strictEqual(search("").length, 0, "empty query yields no results");
  ok(search("service unavailable").some((s) => s.code === 503), "meaning substring search works");
  ok(search("404").some((s) => s.code === 404), "code string search works");
}
