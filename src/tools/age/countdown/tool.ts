import { pad2 } from "../_lib.ts";

export interface CountdownParts {
  totalSeconds: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
}

export function countdownParts(target: Date, now: Date): CountdownParts {
  if (Number.isNaN(target.getTime()) || Number.isNaN(now.getTime())) {
    return { totalSeconds: 0, days: 0, hours: 0, minutes: 0, seconds: 0, done: false };
  }
  const ms = Math.max(0, target.getTime() - now.getTime());
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { totalSeconds, days, hours, minutes, seconds, done: ms === 0 };
}

export function encodeTarget(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export function parseEncodedTarget(value: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value ?? "");
  if (!m) return new Date(NaN);
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const day = Number(m[3]);
  const h = Number(m[4]);
  const min = Number(m[5]);
  const d = new Date(y, mo - 1, day, h, min);
  if (
    d.getFullYear() !== y ||
    d.getMonth() !== mo - 1 ||
    d.getDate() !== day ||
    d.getHours() !== h ||
    d.getMinutes() !== min
  ) {
    return new Date(NaN);
  }
  return d;
}

export function countdownShareUrl(base: string, target: Date): string {
  return `${base}?target=${encodeURIComponent(encodeTarget(target))}`;
}
