import { strictEqual, ok } from "node:assert";
import { readArchive, extractArchive, createArchive, formatBytes } from "./tool.ts";

export async function runTest() {
  strictEqual(formatBytes(500), "500 B");
  strictEqual(formatBytes(2048), "2.0 KB");

  // Test TAR reading
  const encoder = new TextEncoder();
  const header = new Uint8Array(512);
  const name = "test.txt";
  const data = encoder.encode("Hello TAR!");
  header.set(encoder.encode(name), 0);
  const sizeStr = data.length.toString(8).padStart(11, "0") + " ";
  header.set(encoder.encode(sizeStr), 124);
  header[156] = 0x30;
  const checksum = header.reduce((sum, b) => sum + b, 0);
  const checksumStr = checksum.toString(8).padStart(6, "0") + "\0 ";
  header.set(encoder.encode(checksumStr), 148);

  const padding = (512 - (data.length % 512)) % 512;
  const fileWithPadding = new Uint8Array(data.length + padding);
  fileWithPadding.set(data);

  const endPadding = new Uint8Array(1024);

  const tarData = new Uint8Array(header.length + fileWithPadding.length + endPadding.length);
  tarData.set(header, 0);
  tarData.set(fileWithPadding, header.length);
  tarData.set(endPadding, header.length + fileWithPadding.length);

  const tarResult = await readArchive(tarData, "tar");
  strictEqual(tarResult.entries.length, 1, "Should have 1 entry");
  strictEqual(tarResult.entries[0].name, "test.txt");
  strictEqual(tarResult.entries[0].size, data.length);

  const tarExtracted = await extractArchive({ format: "tar", data: tarData });
  strictEqual(tarExtracted.size, 1);
  strictEqual(new TextDecoder().decode(tarExtracted.get("test.txt")!), "Hello TAR!");

  console.log("  TAR read/extract: OK");

  // Test GZIP
  const gzipData = await createArchive({ format: "gzip", files: [{ name: "test.txt", data: new TextEncoder().encode("Hello GZIP! ".repeat(100)) }], level: 6 });

  const gzipResult = await readArchive(gzipData, "gzip");
  strictEqual(gzipResult.entries.length, 1);
  ok(gzipResult.totalSize > 0);

  const gzipExtracted = await extractArchive({ format: "gzip", data: gzipData });
  strictEqual(gzipExtracted.size, 1);
  strictEqual(new TextDecoder().decode(gzipExtracted.get("decompressed")!), new TextDecoder().decode(new TextEncoder().encode("Hello GZIP! ".repeat(100))));

  console.log("  GZIP round-trip: OK");

  // Test createArchive
  const files = [
    { name: "a.txt", data: new TextEncoder().encode("File A") },
    { name: "b.txt", data: new TextEncoder().encode("File B") },
  ];

  const tar = await createArchive({ format: "tar", files });
  ok(tar.length > 0);
  const tarResult2 = await readArchive(tar, "tar");
  strictEqual(tarResult2.entries.length, 2);

  const gzip = await createArchive({ format: "gzip", files: [{ name: "single.txt", data: new TextEncoder().encode("Single") }] });
  ok(gzip.length > 0);

  console.log("  Create archive (TAR/GZIP): OK");
  console.log("All archive tests passed");
}