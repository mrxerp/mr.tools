import { strictEqual } from "node:assert";
import { cleanMarkdown, extractArticle } from "./tool.ts";

export async function runTest() {
  const messy = `Cookie Consent: We use cookies to improve your experience.
Subscribe to our newsletter!
Share on Facebook | Twitter | Instagram

This is the main article content.
It spans multiple lines and should be cleaned up.

Related articles you may also like:
- Article 1
- Article 2

5 min read

More footer junk here.`;

  const result = cleanMarkdown(messy);
  strictEqual(result.markdown.includes("Cookie Consent"), false);
  strictEqual(result.markdown.includes("Subscribe"), false);
  strictEqual(result.markdown.includes("Share on Facebook"), false);
  strictEqual(result.markdown.includes("Related articles"), false);
  strictEqual(result.markdown.includes("5 min read"), false);
  strictEqual(result.markdown.includes("main article content"), true);
  strictEqual(result.markdown.includes("spans multiple lines"), true);
  strictEqual(result.warnings.length > 0, true);

  const textWithQuotes = `He said "Hello world" and she replied 'Goodbye'.
“Smart quotes” and ‘single quotes’ should be normalized.`;
  const result2 = cleanMarkdown(textWithQuotes);
  strictEqual(result2.markdown.includes('"'), true);
  strictEqual(result2.markdown.includes("'"), true);
  strictEqual(result2.markdown.includes("“"), false);
  strictEqual(result2.markdown.includes("”"), false);
}