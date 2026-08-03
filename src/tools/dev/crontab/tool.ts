export interface Fields {
  minute: Set<number>;
  hour: Set<number>;
  dom: Set<number>;
  month: Set<number>;
  dow: Set<number>;
}

export const PRESETS: Record<string, string> = {
  "Every minute": "* * * * *",
  "Every 5 minutes": "*/5 * * * *",
  "Hourly": "0 * * * *",
  "Daily at 9am": "0 9 * * *",
  "Weekly Monday 9am": "0 9 * * 1",
  "Monthly on 1st": "0 0 1 * *",
};

function parseField(field: string, name: string, min: number, max: number): Set<number> {
  const values = new Set<number>();
  for (const part of field.split(",")) {
    const match = /^(\*|\d+)(?:-(\d+))?(?:\/(\d+))?$/.exec(part);
    if (!match) {
      throw new Error(`Invalid ${name} field "${part}"`);
    }
    let start: number;
    let end: number;
    if (match[1] === "*") {
      if (match[2] !== undefined) {
        throw new Error(`Invalid ${name} field "${part}"`);
      }
      start = min;
      end = max;
    } else {
      start = Number(match[1]);
      end = match[2] !== undefined ? Number(match[2]) : start;
    }
    const step = match[3] !== undefined ? Number(match[3]) : 1;
    if (!Number.isInteger(step) || step < 1) {
      throw new Error(`Invalid step in ${name} field "${part}"`);
    }
    if (start < min || start > max || end < min || end > max || end < start) {
      throw new Error(
        `Value out of range in ${name} field "${part}" (${min}-${max})`,
      );
    }
    for (let v = start; v <= end; v += step) {
      values.add(v);
    }
  }
  return values;
}

export function parseCron(expr: string): Fields {
  if (typeof expr !== "string") {
    throw new Error("cron expression must be a string");
  }
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new Error(`Expected 5 cron fields, got ${parts.length}`);
  }
  const [minute, hour, dom, month, dow] = parts;
  const dowRaw = parseField(dow, "day-of-week", 0, 7);
  const dowNormalized = new Set<number>();
  for (const v of dowRaw) {
    dowNormalized.add(v === 7 ? 0 : v);
  }
  return {
    minute: parseField(minute, "minute", 0, 59),
    hour: parseField(hour, "hour", 0, 23),
    dom: parseField(dom, "day-of-month", 1, 31),
    month: parseField(month, "month", 1, 12),
    dow: dowNormalized,
  };
}

export function nextRuns(expr: string, from: Date, count: number): Date[] {
  if (!Number.isInteger(count) || count < 1) {
    throw new Error("count must be a positive integer");
  }
  const fields = parseCron(expr);
  const domWild = fields.dom.size === 31;
  const dowWild = fields.dow.size === 7;
  const monthWild = fields.month.size === 12;
  const hours = Array.from(fields.hour).sort((a, b) => a - b);
  const minutes = Array.from(fields.minute).sort((a, b) => a - b);
  const results: Date[] = [];
  const day = new Date(from.getFullYear(), from.getMonth(), from.getDate());

  for (let i = 0; i < 400 * 366 && results.length < count; i++) {
    if (monthWild || fields.month.has(day.getMonth() + 1)) {
      const domOk = fields.dom.has(day.getDate());
      const dowOk = fields.dow.has(day.getDay());
      const dayOk = domWild && dowWild ? true : domWild ? dowOk : dowWild ? domOk : domOk && dowOk;
      if (dayOk) {
        for (const h of hours) {
          for (const mi of minutes) {
            const dt = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, mi, 0, 0);
            if (dt.getTime() > from.getTime()) {
              results.push(dt);
              if (results.length === count) break;
            }
          }
          if (results.length === count) break;
        }
      }
    }
    day.setDate(day.getDate() + 1);
  }
  if (results.length < count) {
    throw new Error("Could not find enough future run times");
  }
  return results;
}
