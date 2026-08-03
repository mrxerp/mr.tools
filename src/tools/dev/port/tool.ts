export const RANGES = {
  "well-known": [0, 1023],
  "registered": [1024, 49151],
  "dynamic": [49152, 65535],
} as const;

export type PortRange = keyof typeof RANGES;

export const COMMON_CONFLICTS = [
  21, 22, 25, 53, 80, 110, 143, 443, 3306, 5432, 6379, 8080, 3000, 5000,
];

function randomInt(min: number, max: number): number {
  const span = max - min + 1;
  const limit = Math.floor(65536 / span) * span;
  const buf = new Uint16Array(1);
  let v: number;
  do {
    crypto.getRandomValues(buf);
    v = buf[0];
  } while (v >= limit);
  return min + (v % span);
}

export function randomPort(min: number, max: number): number {
  if (!Number.isInteger(min) || !Number.isInteger(max)) {
    throw new Error("min and max must be integers");
  }
  if (min < 0 || max > 65535 || min > max) {
    throw new Error("invalid port range");
  }
  return randomInt(min, max);
}

export function classifyPort(n: number): "well-known" | "registered" | "dynamic" {
  if (!Number.isInteger(n) || n < 0 || n > 65535) {
    throw new Error("port must be an integer from 0 to 65535");
  }
  if (n <= 1023) return "well-known";
  if (n <= 49151) return "registered";
  return "dynamic";
}
