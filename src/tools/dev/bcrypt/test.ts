import { strictEqual, ok } from "node:assert";
import { hashPassword, verifyPassword, clampRounds } from "./tool.ts";

export async function runTest() {
  const hash = await hashPassword("hunter2", 10);
  ok(hash.startsWith("$2"), "hash starts with $2");
  ok(hash.startsWith("$2b$10$"), "cost 10 hash uses $2b$10");
  ok(await verifyPassword("hunter2", hash), "correct password verifies");
  ok(!(await verifyPassword("wrong", hash)), "wrong password rejected");
  ok(!(await verifyPassword("hunter2", "not-a-bcrypt-hash")), "garbage hash rejected");

  strictEqual(clampRounds(2), 4, "rounds clamp low");
  strictEqual(clampRounds(99), 14, "rounds clamp high");
  strictEqual(clampRounds(8), 8, "rounds in range pass through");
  strictEqual(clampRounds(Number.NaN), 10, "non-finite rounds default to 10");

  const empty = await hashPassword("", 4);
  ok(empty.startsWith("$2b$04$"), "empty password hashes fine at cost 4");
  ok(await verifyPassword("", empty), "empty password round-trips");
}
