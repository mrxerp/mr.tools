import { strictEqual, ok } from "node:assert";
import { buildMetaTags, titleLength, descriptionLength } from "./tool.ts";

export async function runTest() {
  const full = buildMetaTags({
    title: "My Page",
    description: "A page about things",
    url: "https://example.com/page",
    image: "https://example.com/img.png",
    type: "article",
    siteName: "Example",
    twitterCard: "summary_large_image",
    themeColor: "#fff",
    robots: "index,follow",
  });

  ok(full.includes('property="og:title" content="My Page"'), "og:title present with value");
  ok(full.includes('property="og:image" content="https://example.com/img.png"'), "og:image present");
  ok(full.includes('name="twitter:card" content="summary_large_image"'), "twitter:card present");
  ok(full.includes('name="twitter:image" content="https://example.com/img.png"'), "twitter:image present");
  ok(full.includes('<link rel="canonical" href="https://example.com/page">'), "canonical when url set");
  ok(full.includes("<title>My Page</title>"), "title tag present");
  ok(full.includes('name="description" content="A page about things"'), "description present");

  const noUrl = buildMetaTags({ title: "T", description: "D" });
  ok(!noUrl.includes("rel=\"canonical\""), "canonical skipped when url not set");
  ok(!noUrl.includes("twitter:image"), "twitter:image skipped when image not set");

  const canonicalOverride = buildMetaTags({ url: "https://example.com/a", canonical: "https://example.com/b" });
  ok(canonicalOverride.includes('href="https://example.com/b"'), "explicit canonical wins");

  const quoted = buildMetaTags({ title: 'Say "hi" <ok> & bye', url: "https://e.com" });
  ok(quoted.includes("Say &quot;hi&quot;"), "title double quote escaped as &quot;");
  ok(quoted.includes("&lt;ok&gt; &amp; bye"), "title <, >, & escaped");
  ok(quoted.includes('content="Say &quot;hi&quot; &lt;ok&gt; &amp; bye"'), "escaped attribute value");

  const empty = buildMetaTags({});
  strictEqual(empty, "", "empty input yields no tags");
  ok(!empty.includes('property="og:title"'), "empty title yields no og:title");

  const noTitle = buildMetaTags({ description: "only desc" });
  ok(!noTitle.includes("og:title"), "no og:title without title");

  strictEqual(titleLength("abc"), 3, "titleLength counts chars");
  strictEqual(titleLength(""), 0, "empty title length 0");
  strictEqual(titleLength(undefined), 0, "missing title length 0");
  strictEqual(descriptionLength("hello"), 5, "descriptionLength counts chars");
  strictEqual(descriptionLength(undefined), 0, "missing description length 0");
}
