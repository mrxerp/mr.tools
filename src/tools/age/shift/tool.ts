export interface ShiftEntry {
  date: string;
  in: string;
  out: string;
  breakMinutes: number;
}

export interface ShiftTotal {
  minutes: number;
  hours: number;
  pay: number;
  overnight: boolean;
}

export function parseTime(value: string): number | null {
  const m = /^(\d{1,2}):([0-5]\d)$/.exec((value ?? "").trim());
  if (!m) return null;
  const h = Number(m[1]);
  if (h > 23) return null;
  return h * 60 + Number(m[2]);
}

export function shiftMinutes(inTime: string, outTime: string, breakMinutes = 0): number {
  const start = parseTime(inTime);
  const end = parseTime(outTime);
  if (start === null || end === null) return 0;
  let minutes = end - start;
  if (minutes <= 0) minutes += 24 * 60;
  return Math.max(0, minutes - Math.max(0, breakMinutes));
}

export function computeShift(entry: ShiftEntry, rate = 0): ShiftTotal {
  const minutes = shiftMinutes(entry.in, entry.out, entry.breakMinutes);
  const hours = minutes / 60;
  return {
    minutes,
    hours,
    pay: hours * rate,
    overnight: (parseTime(entry.out) ?? 0) <= (parseTime(entry.in) ?? 0),
  };
}

export function computeShifts(entries: ShiftEntry[], rate = 0) {
  let totalMinutes = 0;
  let totalPay = 0;
  const rows = entries.map((e) => {
    const t = computeShift(e, rate);
    totalMinutes += t.minutes;
    totalPay += t.pay;
    return { ...e, ...t };
  });
  return {
    rows,
    totalMinutes,
    totalPay,
    totalHours: totalMinutes / 60,
    days: entries.length,
  };
}

export function csvField(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function toCsv(entries: ShiftEntry[], rate = 0): string {
  const lines = ["Date,Clock in,Clock out,Break (min),Hours,Pay"];
  for (const e of entries) {
    const t = computeShift(e, rate);
    lines.push(
      [e.date, e.in, e.out, String(e.breakMinutes), t.hours.toFixed(2), t.pay.toFixed(2)]
        .map(csvField)
        .join(","),
    );
  }
  if (entries.length) {
    const totals = computeShifts(entries, rate);
    lines.push(
      `,,,Total,${totals.totalHours.toFixed(2)},${totals.totalPay.toFixed(2)}`,
    );
  }
  return lines.join("\n");
}
