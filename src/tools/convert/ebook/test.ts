import { strictEqual, ok } from "node:assert";
import { resolveCover, formatBytes } from "./tool.ts";

export async function runTest() {
  strictEqual(formatBytes(500), "500 B");
  strictEqual(formatBytes(2048), "2.0 KB");
  strictEqual(formatBytes(1024 * 1024), "1.0 MB");
  strictEqual(formatBytes(1024 * 1024 * 1024), "1.00 GB");

  const manifest = new Map([["cover-img", { href: "cover.jpg", mimeType: "image/jpeg" }]]);
  const resources = new Map([["cover-img", new Uint8Array([0xff, 0xd8, 0xff, 0xe0])]]);

  ok(resolveCover(undefined, manifest, resources) === undefined, "no coverId resolves nothing");
  ok(resolveCover("missing", manifest, resources) === undefined, "unknown coverId resolves nothing");

  const cover = resolveCover("cover-img", manifest, resources);
  ok(cover, "coverId + manifest + resource resolves a cover");
  strictEqual(cover!.mimeType, "image/jpeg", "cover mime type from manifest");
  strictEqual(cover!.data.length, 4, "cover bytes come from the manifest resource");

  const noMime = new Map([["c", { href: "x.png", mimeType: "" }]]);
  strictEqual(
    resolveCover("c", noMime, new Map([["c", new Uint8Array(2)]]))!.mimeType,
    "image/jpeg",
    "missing mime type defaults to image/jpeg",
  );

  console.log("All ebook tests passed (basic)");
}
