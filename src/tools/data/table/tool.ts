export interface TableOptions {
  flatten?: boolean;
  separator?: string;
  handleNulls?: "empty" | "null" | "skip";
  includeHeader?: boolean;
}

export interface TableResult {
  csv: string;
  headers: string[];
  rows: unknown[][];
  warnings?: string[];
  error?: string;
}

export interface ParseResult {
  data: unknown[];
  error?: string;
}

export function jsonToCsv(input: string, options: TableOptions = {}): TableResult {
  const { flatten = true, separator = ".", handleNulls = "empty", includeHeader = true } = options;
  const warnings: string[] = [];

  let data: unknown;
  try {
    data = JSON.parse(input);
  } catch (e) {
    return {
      csv: "",
      headers: [],
      rows: [],
      error: (e as Error).message,
    };
  }

  if (!Array.isArray(data)) {
    return {
      csv: "",
      headers: [],
      rows: [],
      error: "Input must be a JSON array",
    };
  }

  if (data.length === 0) {
    return { csv: "", headers: [], rows: [], warnings: ["Empty array"] };
  }

  const flattened = flatten ? data.map((row) => flattenObject(row, separator)) : data;
  const allKeys = new Set<string>();
  for (const row of flattened) {
    if (row && typeof row === "object") {
      Object.keys(row).forEach((k) => allKeys.add(k));
    }
  }
  const headers = Array.from(allKeys).sort();

  const rows: unknown[][] = [];
  for (const row of flattened) {
    const values: unknown[] = [];
    for (const header of headers) {
      let val = row && typeof row === "object" ? (row as Record<string, unknown>)[header] : undefined;
      if (val === null || val === undefined) {
        if (handleNulls === "null") val = "null";
        else if (handleNulls === "skip") val = "";
        else val = "";
      }
      values.push(val);
    }
    rows.push(values);
  }

  const csvRows: string[] = [];
  if (includeHeader) {
    csvRows.push(headers.map(escapeCsv).join(","));
  }
  for (const row of rows) {
    csvRows.push(row.map((v) => escapeCsv(String(v ?? ""))).join(","));
  }

  return { csv: csvRows.join("\n"), headers, rows, warnings: warnings.length ? warnings : undefined };
}

export function flattenObject(obj: unknown, separator: string, prefix = ""): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if (obj === null || typeof obj !== "object") {
    if (prefix) result[prefix] = obj;
    return result;
  }
  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      if (prefix) result[prefix] = [];
      return result;
    }
    obj.forEach((item, i) => {
      const itemPrefix = prefix ? `${prefix}${separator}${i}` : String(i);
      Object.assign(result, flattenObject(item, separator, itemPrefix));
    });
    return result;
  }
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const newPrefix = prefix ? `${prefix}${separator}${key}` : key;
    Object.assign(result, flattenObject(value, separator, newPrefix));
  }
  return result;
}

export function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n") || value.includes("\r")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function csvToJson(csvInput: string, options: TableOptions = {}): ParseResult {
  const { flatten = false, separator = "." } = options;
  const lines = csvInput.trim().split("\n");
  if (lines.length < 2) return { data: [] };

  const headers = parseCsvLine(lines[0]);
  const data: unknown[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const row: Record<string, unknown> = {};
    for (let j = 0; j < headers.length; j++) {
      const val = values[j] ?? "";
      const num = Number(val);
      row[headers[j]] = isNaN(num) || val === "" ? val : num;
    }
    data.push(flatten ? unflattenObject(row, separator) : row);
  }

  return { data };
}

export function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export function unflattenObject(obj: Record<string, unknown>, separator: string): unknown {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const parts = key.split(separator);
    let current: Record<string, unknown> = result;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      const isArrayIndex = /^\d+$/.test(parts[i + 1]);
      if (!(part in current)) {
        current[part] = isArrayIndex ? [] : {};
      }
      current = current[part] as Record<string, unknown>;
    }
    const lastPart = parts[parts.length - 1];
    current[lastPart] = value;
  }
  return result;
}

export function detectDelimiter(csvInput: string): string {
  const firstLine = csvInput.split("\n")[0];
  const delimiters = [",", ";", "\t", "|"];
  let bestDelim = ",";
  let maxCount = 0;
  for (const delim of delimiters) {
    const count = (firstLine.match(new RegExp(delim.replace("|", "\\|"), "g")) || []).length;
    if (count > maxCount) {
      maxCount = count;
      bestDelim = delim;
    }
  }
  return bestDelim;
}