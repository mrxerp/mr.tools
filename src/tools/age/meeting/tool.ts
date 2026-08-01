import { formatTime, offsetAtMinutes, pad2, parseDateInput } from "../_lib.ts";

export interface MeetingOptions {
  startHour: number;
  endHour: number;
  stepMinutes: number;
}

export interface SlotCell {
  zone: string;
  local: string;
  working: boolean;
}

export interface SlotRow {
  refLocal: string;
  cells: SlotCell[];
  allWorking: boolean;
}

export function isWorking(hour: number, minute: number, startHour: number, endHour: number): boolean {
  const t = hour + minute / 60;
  return t >= startHour && t < endHour;
}

export function refInstant(date: Date, zone: string, hour: number, minute: number): Date {
  const wall = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute);
  const noon = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12));
  return new Date(wall - offsetAtMinutes(noon, zone) * 60000);
}

export function slotGrid(
  date: Date,
  zones: string[],
  opts: MeetingOptions,
): SlotRow[] {
  const rows: SlotRow[] = [];
  const slotCount = (opts.endHour - opts.startHour) * (60 / opts.stepMinutes);
  for (let i = 0; i < slotCount; i++) {
    const fromStart = i * opts.stepMinutes;
    const hour = opts.startHour + Math.floor(fromStart / 60);
    const minute = fromStart % 60;
    const instant = refInstant(date, zones[0], hour, minute);
    const cells = zones.map((zone) => {
      const local = formatTime(instant, zone);
      const h = Number(local.slice(0, 2));
      const m = Number(local.slice(3, 5));
      return {
        zone,
        local,
        working: isWorking(h, m, opts.startHour, opts.endHour),
      };
    });
    rows.push({
      refLocal: formatTime(instant, zones[0]),
      cells,
      allWorking: cells.every((c) => c.working),
    });
  }
  return rows;
}

export function meetingShareUrl(
  base: string,
  date: Date,
  hour: number,
  minute: number,
  zones: string[],
): string {
  const q = new URLSearchParams();
  q.set("date", `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`);
  q.set("time", `${pad2(hour)}:${pad2(minute)}`);
  q.set("zones", zones.join(","));
  return `${base}?${q.toString()}`;
}

export interface MeetingParams {
  date: Date;
  hour: number;
  minute: number;
  zones: string[];
}

export function parseMeetingParams(search: string): MeetingParams | null {
  const q = new URLSearchParams(search);
  const date = parseDateInput(q.get("date") ?? "");
  const time = /^(\d{2}):(\d{2})$/.exec(q.get("time") ?? "");
  const zones = (q.get("zones") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!time || Number.isNaN(date.getTime()) || zones.length < 2) return null;
  return {
    date,
    hour: Number(time[1]),
    minute: Number(time[2]),
    zones,
  };
}
