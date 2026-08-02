import { strictEqual } from "node:assert";
import { computeHashes } from "./tool.ts";

export async function runTest() {
  const text = "hello world";
  const hashes = await computeHashes(text, ["SHA-256", "SHA-384", "SHA-512"]);

  strictEqual(hashes.length, 3, "three algorithms");

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
  strictEqual(emptyHashes.length, 3, "empty input still computes");

  // Test HMAC
  const hmacHashes = await computeHashes(text, ["SHA-256"], "secret-key");
  const hmacSha256 = hmacHashes.find((h) => h.algorithm === "SHA-256")?.hash;
  strictEqual(
    hmacSha256,
    "095d5a21fe6d0646db223fdf3de6436bb8dfb2fab0b51677ecf6441fcf5f2a67",
    "HMAC-SHA256 produces correct output",
  );

  // Test subset of algorithms
  const subset = await computeHashes(text, ["SHA-256", "SHA-512"]);
  strictEqual(subset.length, 2, "subset of algorithms works");
}