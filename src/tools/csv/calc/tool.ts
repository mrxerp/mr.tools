export type CalcOp =
  | "add" | "subtract" | "multiply" | "divide"
  | "sum" | "avg" | "pct-change" | "increment"
  | "concat" | "replace" | "slice" | "uppercase" | "lowercase" | "trim"
  | "days-between" | "add-days" | "format-date"
  | "if" | "coalesce";

export interface CalcStep {
  id: string;
  op: CalcOp;
  targetColumn: string;
  sourceColumns: string[];
  params: Record<string, string>;
  enabled: boolean;
}

export interface CalcOptions {
  steps: CalcStep[];
  newColumnName: string;
}

export interface CalcResult {
  headers: string[];
  rows: string[][];
  previewColumn: { name: string; values: string[] };
  stats: {
    totalRows: number;
    computedRows: number;
    errors: number;
  };
}

function detectDelimiter(text: string): string {
  const delimiters = [",", "\t", ";", "|"];
  const firstLine = text.split(/\r?\n/)[0] || "";
  let bestDelim = ",";
  let maxCount = 0;
  for (const d of delimiters) {
    const count = (firstLine.match(new RegExp(d.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
    if (count > maxCount) { maxCount = count; bestDelim = d; }
  }
  return bestDelim;
}

export function parseCSV(text: string): string[][] {
  const delimiter = detectDelimiter(text);
  const lines = text.split(/\r?\n/);
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    let j = 0;
    while (j < line.length) {
      const ch = line[j];
      if (ch === '"') {
        if (inQuotes && j + 1 < line.length && line[j + 1] === '"') { currentField += '"'; j += 2; continue; }
        inQuotes = !inQuotes; j++;
      } else if (ch === delimiter && !inQuotes) { currentRow.push(currentField); currentField = ""; j++; }
      else { currentField += ch; j++; }
    }
    if (!inQuotes) { currentRow.push(currentField); rows.push(currentRow); currentRow = []; currentField = ""; i++; }
    else { currentField += "\n"; i++; }
  }
  if (currentField || currentRow.length > 0) { currentRow.push(currentField); rows.push(currentRow); }
  return rows;
}

export function stringifyCSV(headers: string[], rows: string[][]): string {
  const escape = (field: string) => {
    if (field.includes(",") || field.includes('"') || field.includes("\n") || field.includes("\r")) {
      return '"' + field.replace(/"/g, '""') + '"';
    }
    return field;
  };
  const lines = [headers.map(escape).join(",")];
  for (const row of rows) { lines.push(row.map(escape).join(",")); }
  return lines.join("\n");
}

function toNum(v: string): number | null {
  const n = Number(v.trim().replace(/[$,%]/g, ""));
  return isNaN(n) ? null : n;
}

function toDate(v: string): Date | null {
  const d = new Date(v.trim().replace(/\//g, "-"));
  return isNaN(d.getTime()) ? null : d;
}

export function calculate(
  input: string,
  options: CalcOptions
): CalcResult {
  const data = parseCSV(input);
  const headers = data[0] || [];
  const rows = data.slice(1);
  const colIndex = (name: string) => headers.indexOf(name);

  const previewValues: string[] = [];
  let errors = 0;

  for (const step of options.steps) {
    if (!step.enabled) continue;
    const targetIdx = colIndex(step.targetColumn);
    const sourceIdxs = step.sourceColumns.map(colIndex).filter(i => i >= 0);

    if (targetIdx < 0 || sourceIdxs.length === 0) {
      errors++;
      continue;
    }

    for (let r = 0; r < rows.length; r++) {
      const sourceVals = sourceIdxs.map(i => rows[r][i] || "");
      let result: string | number = "";

      try {
        switch (step.op) {
          case "add": {
            const nums = sourceVals.map(toNum).filter(n => n !== null) as number[];
            result = nums.reduce((a, b) => a + b, 0);
            break;
          }
          case "subtract": {
            const nums = sourceVals.map(toNum).filter(n => n !== null) as number[];
            result = nums.length > 1 ? nums[0] - nums.slice(1).reduce((a, b) => a + b, 0) : (nums[0] || 0);
            break;
          }
          case "multiply": {
            const nums = sourceVals.map(toNum).filter(n => n !== null) as number[];
            result = nums.reduce((a, b) => a * b, 1);
            break;
          }
          case "divide": {
            const nums = sourceVals.map(toNum).filter(n => n !== null) as number[];
            result = nums.length > 1 && nums.slice(1).every(n => n !== 0)
              ? nums[0] / nums.slice(1).reduce((a, b) => a * b, 1)
              : "Error: div by zero";
            break;
          }
          case "sum": {
            const nums = sourceVals.map(toNum).filter(n => n !== null) as number[];
            result = nums.reduce((a, b) => a + b, 0);
            break;
          }
          case "avg": {
            const nums = sourceVals.map(toNum).filter(n => n !== null) as number[];
            result = nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : "";
            break;
          }
          case "pct-change": {
            if (sourceVals.length >= 2) {
              const a = toNum(sourceVals[0]);
              const b = toNum(sourceVals[1]);
              if (a !== null && b !== null && a !== 0) {
                result = ((b - a) / Math.abs(a)) * 100;
              }
            }
            break;
          }
          case "increment": {
            const base = toNum(sourceVals[0]) || 0;
            const inc = Number(step.params.increment) || 1;
            result = base + inc;
            break;
          }
          case "concat": {
            const sep = step.params.separator || "";
            result = sourceVals.join(sep);
            break;
          }
          case "replace": {
            const find = step.params.find || "";
            const repl = step.params.replace || "";
            result = sourceVals[0].replace(new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), repl);
            break;
          }
          case "slice": {
            const start = Number(step.params.start) || 0;
            const end = step.params.end ? Number(step.params.end) : undefined;
            result = sourceVals[0].slice(start, end);
            break;
          }
          case "uppercase": {
            result = sourceVals[0].toUpperCase();
            break;
          }
          case "lowercase": {
            result = sourceVals[0].toLowerCase();
            break;
          }
          case "trim": {
            result = sourceVals[0].trim();
            break;
          }
          case "days-between": {
            if (sourceVals.length >= 2) {
              const d1 = toDate(sourceVals[0]);
              const d2 = toDate(sourceVals[1]);
              if (d1 && d2) result = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
            }
            break;
          }
          case "add-days": {
            const d = toDate(sourceVals[0]);
            const days = Number(step.params.days) || 0;
            if (d) result = new Date(d.getTime() + days * 86400000).toISOString().split("T")[0];
            break;
          }
          case "format-date": {
            const d = toDate(sourceVals[0]);
            const fmt = step.params.format || "iso";
            if (d) {
              if (fmt === "iso") result = d.toISOString().split("T")[0];
              else if (fmt === "us") result = d.toLocaleDateString("en-US");
              else if (fmt === "eu") result = d.toLocaleDateString("en-GB");
              else result = d.toISOString().split("T")[0];
            }
            break;
          }
          case "if": {
            const cond = sourceVals[0].trim().toLowerCase();
            const trueVal = step.params.true || "true";
            const falseVal = step.params.false || "false";
            const truthy = cond === "true" || cond === "1" || cond === "yes";
            result = truthy ? trueVal : falseVal;
            break;
          }
          case "coalesce": {
            result = sourceVals.find(v => v.trim() !== "") || "";
            break;
          }
        }
      } catch {
        result = "Error";
        errors++;
      }

      rows[r][targetIdx] = String(result);
      if (step.id === options.steps[options.steps.length - 1]?.id) {
        previewValues[r] = String(result);
      }
    }
  }

  const newColName = options.newColumnName || `calc_${Date.now()}`;
  if (!headers.includes(newColName)) {
    headers.push(newColName);
    for (let r = 0; r < rows.length; r++) {
      rows[r].push(previewValues[r] || "");
    }
  }

  return {
    headers,
    rows,
    previewColumn: { name: newColName, values: previewValues },
    stats: {
      totalRows: rows.length,
      computedRows: rows.length - errors,
      errors,
    },
  };
}

export function generatePreviewCsv(result: CalcResult): string {
  return stringifyCSV(result.headers, result.rows);
}