import bcrypt from "bcryptjs";

export function clampRounds(rounds: number): number {
  if (!Number.isFinite(rounds)) return 10;
  return Math.min(14, Math.max(4, Math.round(rounds)));
}

export async function hashPassword(
  password: string,
  rounds: number,
): Promise<string> {
  return bcrypt.hash(password, clampRounds(rounds));
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}
