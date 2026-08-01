import { strictEqual, ok } from "node:assert";
import { chunkSpeech } from "./tool.ts";

export async function runTest() {
  const words = "one two three four five six seven eight nine ten";
  const joined = words.replace(/ /g, ". ");
  strictEqual(chunkSpeech("").length, 0, "empty text yields nothing");

  const chunks = chunkSpeech(joined, 20);
  ok(chunks.length > 1, "long text is split into chunks");
  strictEqual(chunks.join(" "), joined, "chunks join back to the original words");

  const short = chunkSpeech("short line", 4000);
  strictEqual(short.length, 1, "short text stays in one chunk");
  strictEqual(short[0], "short line");

  const exact = chunkSpeech("a".repeat(50), 10);
  for (const c of exact) {
    ok(c.length <= 12, "every chunk stays near the max length");
  }
  strictEqual(exact.join(""), "a".repeat(50), "chunks reassemble exact text without a separator");
}
