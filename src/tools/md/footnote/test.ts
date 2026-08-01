import { strictEqual } from "node:assert";
import { renumberFootnotes, inlineToReference, referenceToInline } from "./tool.ts";

export async function runTest() {
  const md = `Text with footnotes.[^first]

[^second]: Second footnote
[^first]: First footnote
[^first]: Duplicate definition
[^unused]: Unused footnote`;

  const result = renumberFootnotes(md);
  strictEqual(result.markdown.includes("[^1]"), true);
  strictEqual(result.markdown.includes("[^1]: First footnote"), true);
  strictEqual(result.markdown.includes("[^2]: Second footnote"), true);
  strictEqual(result.warnings.some((w) => w.includes("Duplicate")), true);
  strictEqual(result.warnings.some((w) => w.includes("Unused")), true);

  const md2 = `See [Google](https://google.com) and [GitHub](https://github.com) and [Google again](https://google.com).`;
  const result2 = inlineToReference(md2);
  strictEqual(result2.markdown.includes("[Google][1]"), true);
  strictEqual(result2.markdown.includes("[GitHub][2]"), true);
  strictEqual(result2.markdown.includes("[Google again][1]"), true);
  strictEqual(result2.markdown.includes("[1]: https://google.com"), true);
  strictEqual(result2.markdown.includes("[2]: https://github.com"), true);

  const md3 = `See [Google][1] and [GitHub][2].

[1]: https://google.com
[2]: https://github.com`;
  const result3 = referenceToInline(md3);
  strictEqual(result3.markdown.includes("[Google](https://google.com)"), true);
  strictEqual(result3.markdown.includes("[GitHub](https://github.com)"), true);
}