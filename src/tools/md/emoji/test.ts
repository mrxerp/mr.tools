import { strictEqual } from "node:assert";
import { shortcodeToUnicode, unicodeToShortcode, searchEmoji, getAllEmoji } from "./tool.ts";

export async function runTest() {
  strictEqual(shortcodeToUnicode("Hello :rocket: world"), "Hello 🚀 world");
  strictEqual(shortcodeToUnicode(":smile: :heart:"), "😄 ❤️");
  strictEqual(shortcodeToUnicode("no emoji here"), "no emoji here");
  strictEqual(shortcodeToUnicode(":nonexistent:"), ":nonexistent:");

  strictEqual(unicodeToShortcode("Hello 🚀 world"), "Hello :rocket: world");
  strictEqual(unicodeToShortcode("😄 ❤️"), ":smile: :heart:");

  const results = searchEmoji("rocket");
  strictEqual(results.length > 0, true);
  strictEqual(results[0].shortcode, "rocket");
  strictEqual(results[0].unicode, "🚀");

  const all = getAllEmoji();
  strictEqual(all.length > 100, true);
  strictEqual(all[0].shortcode, "grinning");
  strictEqual(all[0].unicode, "😀");
}