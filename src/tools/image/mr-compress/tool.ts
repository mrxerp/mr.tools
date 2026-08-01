export function qualityForLevel(level: string): number {
  switch (level) {
    case "smaller":
      return 0.6;
    case "smallest":
      return 0.4;
    default:
      return 0.8;
  }
}

export function percentSaved(before: number, after: number): number {
  if (!Number.isFinite(before) || before <= 0) return 0;
  if (!Number.isFinite(after) || after < 0) after = 0;
  return Math.round((1 - after / before) * 100);
}
