import { strictEqual } from "node:assert";
import { processMarkdown } from "./tool.ts";

export async function runTest() {
  const md = `# First Heading
## Second Heading
Some text.
### Third Heading
More text.`;

  const result = processMarkdown(md);
  strictEqual(result.headings.length, 3);
  strictEqual(result.headings[0].text, "First Heading");
  strictEqual(result.headings[0].anchor, "first-heading");
  strictEqual(result.headings[1].text, "Second Heading");
  strictEqual(result.headings[1].anchor, "second-heading");
  strictEqual(result.headings[2].text, "Third Heading");
  strictEqual(result.headings[2].anchor, "third-heading");

  strictEqual(result.toc.length, 3);
  strictEqual(result.toc[0].text, "First Heading");
  strictEqual(result.toc[0].anchor, "first-heading");
  strictEqual(result.toc[1].text, "Second Heading");
  strictEqual(result.toc[1].anchor, "second-heading");
  strictEqual(result.toc[2].text, "Third Heading");
  strictEqual(result.toc[2].anchor, "third-heading");

  strictEqual(result.markdownWithAnchors.includes('<a id="first-heading"></a>'), true);
  strictEqual(result.markdownWithAnchors.includes('<a id="second-heading"></a>'), true);

  const md2 = `# Heading A
# Heading A
# Another Heading
## Heading A`; // duplicate anchor
  const result2 = processMarkdown(md2);
  strictEqual(result2.headings[0].anchor, "heading-a");
  strictEqual(result2.headings[1].anchor, "heading-a-1");
  strictEqual(result2.headings[2].anchor, "another-heading");
  strictEqual(result2.headings[3].anchor, "heading-a-2");
}