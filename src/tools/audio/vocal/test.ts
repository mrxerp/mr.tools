import { strictEqual, ok } from "node:assert";
import { centerCancel, centerIsolate, sumAbs } from "./tool.ts";

export async function runTest() {
  const n = 64;
  const vocal = new Float32Array(n).map((_, i) => Math.sin(i));
  const leftGuitar = new Float32Array(n).map((_, i) => Math.sin(i * 0.5));
  const rightGuitar = new Float32Array(n).map((_, i) => Math.cos(i * 0.5));

  const left = new Float32Array(n);
  const right = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    left[i] = vocal[i] + leftGuitar[i];
    right[i] = vocal[i] + rightGuitar[i];
  }

  const cancelled = centerCancel(left, right);
  for (let i = 0; i < n; i++) {
    const expected = (leftGuitar[i] - rightGuitar[i]) * 0.5;
    ok(Math.abs(cancelled[i] - expected) < 1e-6, "identical center signal cancels exactly");
  }
  ok(sumAbs(cancelled) > 0, "side content survives cancellation");

  const isolated = centerIsolate(left, right);
  for (let i = 0; i < n; i++) {
    const expected = vocal[i] + (leftGuitar[i] + rightGuitar[i]) * 0.5;
    ok(Math.abs(isolated[i] - expected) < 1e-6, "isolate keeps the center signal");
  }

  const same = new Float32Array(n).fill(0.5);
  strictEqual(sumAbs(centerCancel(same, same)), 0, "two identical channels cancel to zero");
  strictEqual(sumAbs(centerIsolate(same, same)) > 0, true, "two identical channels double in isolation");
}
