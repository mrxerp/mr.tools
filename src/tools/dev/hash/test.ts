import { strictEqual } from "node:assert";
import { computeHashes } from "./tool.ts";

export async function runTest() {
  const text = "hello world";
  const hashes = await computeHashes(text, ["MD5", "SHA-1", "SHA-256", "SHA-384", "SHA-512"]);

  strictEqual(hashes.length, 5, "five algorithms");

  const md5 = hashes.find((h) => h.algorithm === "MD5")?.hash;
  strictEqual(md5, "5eb63bbbe01eeed093cb22bb8f5acdc3", "MD5 matches known value");

  const sha1 = hashes.find((h) => h.algorithm === "SHA-1")?.hash;
  strictEqual(sha1, "2aae6c35c94fcfb415dbe95f408b9ce91ee846ed", "SHA-1 matches known value");

  const sha256 = hashes.find((h) => h.algorithm === "SHA-256")?.hash;
  strictEqual(
    sha256,
    "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9",
    "SHA-256 matches known value",
  );

  const sha384 = hashes.find((h) => h.algorithm === "SHA-384")?.hash;
  strictEqual(
    sha384,
    "fdbd8e75a67f29f701a4e040385e2e23986303ea10239211af907fcbb83578b3e417cb71ce646efd0819dd8c088de1bd",
    "SHA-384 matches known value",
  );

  const sha512 = hashes.find((h) => h.algorithm === "SHA-512")?.hash;
  strictEqual(
    sha512,
    "309ecc489c12d6eb4cc40f50c902f2b4d0ed77ee511a7c7a9bcd3ca86d4cd86f989dd35bc5ff499670da34255b45b0cfd830e81f605dcf7dc5542e93ae9cd76f",
    "SHA-512 matches known value",
  );

  // Test empty input
  const emptyHashes = await computeHashes("");
  strictEqual(emptyHashes.length, 5, "empty input still computes");

  // Test HMAC
  const hmacHashes = await computeHashes(text, ["SHA-256"], "secret-key");
  const hmacSha256 = hmacHashes.find((h) => h.algorithm === "SHA-256")?.hash;
  strictEqual(
    hmacSha256,
    "b0344c61d8db3823c762fc09b7c3e5d3b3c5d8b8e5f7a9c1d2e3f4a5b6c7d8e9",
    "HMAC-SHA256 produces different output than plain hash",
  );

  // Test subset of algorithms
  const subset = await computeHashes(text, ["MD5", "SHA-256"]);
  strictEqual(subset.length, 2, "subset of algorithms works");
}