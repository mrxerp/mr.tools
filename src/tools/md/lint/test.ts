import { strictEqual } from "node:assert";
import { lintMarkdown } from "./tool.ts";

export async function runTest() {
  const md = `# Heading 1
### Heading 3

This line has trailing spaces   

Very long line that exceeds the maximum allowed length of one hundred characters which should trigger a warning from the linter because it goes over the limit.

[empty link]()

![](image.png)

[valid link](https://example.com)

[local link](./page.md)

[bad link](not-a-url)`;

  const result = lintMarkdown(md);
  strictEqual(result.issues.some((i) => i.rule === "heading-hierarchy"), true);
  strictEqual(result.issues.some((i) => i.rule === "line-length"), true);
  strictEqual(result.issues.some((i) => i.rule === "trailing-spaces"), true);
  strictEqual(result.issues.some((i) => i.rule === "no-empty-links"), true);
  strictEqual(result.issues.some((i) => i.rule === "no-missing-alt"), true);
  strictEqual(result.issues.some((i) => i.rule === "link-validity"), true);

  const fixedResult = lintMarkdown(md, true);
  strictEqual(fixedResult.fixed !== undefined, true);
  strictEqual(fixedResult.fixed!.includes("trailing spaces   "), false);
}