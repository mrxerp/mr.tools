export function round2(n: number): number {
  if (!Number.isFinite(n)) return n;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function requireFinite(n: number, label: string): void {
  if (!Number.isFinite(n)) {
    throw new Error(`${label} must be a finite number`);
  }
}

export function percentageOf(part: number, whole: number): number {
  requireFinite(part, "part");
  requireFinite(whole, "whole");
  if (whole === 0) {
    throw new Error("whole must not be zero");
  }
  return round2((part / whole) * 100);
}

export function valueOf(percent: number, base: number): number {
  requireFinite(percent, "percent");
  requireFinite(base, "base");
  return round2((percent / 100) * base);
}

export function change(from: number, to: number): number {
  requireFinite(from, "from");
  requireFinite(to, "to");
  if (from === 0) {
    throw new Error("from must not be zero");
  }
  return round2(((to - from) / from) * 100);
}

export function percentToReach(current: number, target: number): number {
  requireFinite(current, "current");
  requireFinite(target, "target");
  if (current === 0) {
    throw new Error("current must not be zero");
  }
  return round2(((target - current) / current) * 100);
}
