import { strictEqual, throws } from "node:assert";
import { parseUrl } from "./tool.ts";

export async function runTest() {
  const u = parseUrl(
    "https://user:pass@example.com:8443/path/to/file?key%20a=value+1&b=2#section",
  );
  strictEqual(u.scheme, "https", "scheme");
  strictEqual(u.username, "user", "username");
  strictEqual(u.password, "pass", "password");
  strictEqual(u.hostname, "example.com", "hostname");
  strictEqual(u.port, "8443", "port");
  strictEqual(u.pathname, "/path/to/file", "pathname");
  strictEqual(u.query.length, 2, "two query params");
  strictEqual(u.query[0].key, "key a", "query key percent-decoded");
  strictEqual(u.query[0].value, "value+1", "query value decoded");
  strictEqual(u.query[1].key, "b", "second query key");
  strictEqual(u.query[1].value, "2", "second query value");
  strictEqual(u.fragment, "section", "fragment");
  strictEqual(u.raw.startsWith("https://"), true, "raw input preserved");

  const mail = parseUrl("mailto:user@example.com");
  strictEqual(mail.scheme, "mailto", "mailto scheme");
  strictEqual(mail.hostname, "", "no hostname for mailto");
  strictEqual(mail.pathname, "user@example.com", "mailto target as pathname");

  const mailQuery = parseUrl("mailto:a@b.com?subject=hi");
  strictEqual(mailQuery.query[0].key, "subject", "mailto query parsed");
  strictEqual(mailQuery.query[0].value, "hi", "mailto query value");

  const frag = parseUrl("https://example.com/a?x=1#frag");
  strictEqual(frag.fragment, "frag", "fragment extracted");

  const enc = parseUrl("https://example.com/a%20b?q=100%25");
  strictEqual(enc.pathname, "/a b", "pathname percent-decoded");
  strictEqual(enc.query[0].value, "100%", "percent-encoded value decoded");

  const noQuery = parseUrl("https://example.com/plain");
  strictEqual(noQuery.query.length, 0, "no query params");

  throws(() => parseUrl(""), /empty/i, "empty input throws");
  throws(() => parseUrl("   "), /empty/i, "whitespace-only input throws");
  throws(() => parseUrl("ht tp://example.com"), /spaces/, "spaces in URL throw");
  throws(() => parseUrl("example.com"), /scheme/, "missing scheme throws");
  throws(() => parseUrl("https://[::1"), /bracket/i, "unbalanced bracket throws");
}
