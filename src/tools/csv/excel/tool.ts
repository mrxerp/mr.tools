export type ColumnType = "string" | "number" | "boolean" | "date" | "auto";

export interface ColumnConfig {
  name: string;
  type: ColumnType;
  dateFormat?: string;
}

export interface ConvertOptions {
  columns: ColumnConfig[];
  includeHeader: boolean;
  jsonFormat: "array" | "objects" | "columns";
}

export interface ConvertResult {
  json: unknown;
  csv?: string;
  xlsx?: Uint8Array;
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

function parseCSV(text: string): string[][] {
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
        if (inQuotes && j + 1 < line.length && line[j + 1] === '"') {
          currentField += '"'; j += 2; continue;
        }
        inQuotes = !inQuotes; j++;
      } else if (ch === delimiter && !inQuotes) {
        currentRow.push(currentField); currentField = ""; j++;
      } else { currentField += ch; j++; }
    }
    if (!inQuotes) { currentRow.push(currentField); rows.push(currentRow); currentRow = []; currentField = ""; i++; }
    else { currentField += "\n"; i++; }
  }
  if (currentField || currentRow.length > 0) { currentRow.push(currentField); rows.push(currentRow); }
  return rows;
}

export function inferType(values: string[]): ColumnType {
  let numCount = 0, boolCount = 0, dateCount = 0;
  for (const v of values) {
    const trimmed = v.trim();
    if (!trimmed) continue;
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) numCount++;
    else if (/^(true|false)$/i.test(trimmed)) boolCount++;
    else if (/^\d{4}-\d{2}-\d{2}/.test(trimmed) || /^\d{2}\/\d{2}\/\d{4}/.test(trimmed)) dateCount++;
  }
  const total = values.filter(v => v.trim()).length;
  if (total === 0) return "string";
  if (numCount / total > 0.8) return "number";
  if (boolCount / total > 0.8) return "boolean";
  if (dateCount / total > 0.5) return "date";
  return "string";
}

function convertValue(value: string, type: ColumnType, dateFormat?: string): unknown {
  const trimmed = value.trim();
  if (!trimmed) return type === "number" ? null : "";
  switch (type) {
    case "number": return Number(trimmed);
    case "boolean": return /^true$/i.test(trimmed);
    case "date": {
      const d = new Date(trimmed.replace(/\//g, "-"));
      return isNaN(d.getTime()) ? value : dateFormat === "iso" ? d.toISOString() : d.toLocaleDateString();
    }
    default: return value;
  }
}

export async function spreadsheetToJson(
  input: string | Uint8Array,
  isXlsx: boolean,
  options: ConvertOptions
): Promise<ConvertResult> {
  let headers: string[];
  let rows: string[][];

  if (isXlsx) {
    const XLSX = await import("xlsx");
    const wb = XLSX.read(input, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as string[][];
    headers = data[0] || [];
    rows = data.slice(1);
  } else {
    const text = typeof input === "string" ? input : new TextDecoder().decode(input);
    const data = parseCSV(text);
    headers = data[0] || [];
    rows = data.slice(1);
  }

  const columnConfigs: ColumnConfig[] = options.columns.length > 0
    ? options.columns
    : headers.map(h => ({ name: h, type: "auto" as ColumnType }));

  const inferredTypes: ColumnType[] = columnConfigs.map((cfg, i) => {
    if (cfg.type !== "auto") return cfg.type;
    const colValues = rows.map(r => r[i] || "");
    return inferType(colValues);
  });

  const convertedRows = rows.map(row =>
    row.map((cell, i) => convertValue(cell, inferredTypes[i], columnConfigs[i]?.dateFormat))
  );

  let json: unknown;
  if (options.jsonFormat === "objects") {
    json = convertedRows.map(row => {
      const obj: Record<string, unknown> = {};
      headers.forEach((h, i) => { obj[h] = row[i]; });
      return obj;
    });
  } else if (options.jsonFormat === "columns") {
    const obj: Record<string, unknown[]> = {};
    headers.forEach((h, i) => { obj[h] = convertedRows.map(r => r[i]); });
    json = obj;
  } else {
    json = options.includeHeader ? [headers, ...convertedRows] : convertedRows;
  }

  return { json };
}

export async function jsonToSpreadsheet(
  json: unknown,
  options: ConvertOptions
): Promise<ConvertResult> {
  let headers: string[];
  let rows: unknown[][];

  if (Array.isArray(json)) {
    if (options.jsonFormat === "objects" || (json.length > 0 && typeof json[0] === "object" && !Array.isArray(json[0]))) {
      headers = [...new Set(json.flatMap((r: unknown) => (r && typeof r === "object" ? Object.keys(r as object) : [])))];
      rows = (json as Record<string, unknown>[]).map(r => headers.map(h => r[h]));
    } else if (options.jsonFormat === "columns" && json.length > 0 && typeof json[0] === "object") {
      headers = Object.keys(json[0] as object);
      const cols = json as unknown as Record<string, unknown[]>;
      const maxLen = Math.max(...headers.map(h => (cols[h] as unknown[])?.length || 0));
      rows = Array.from({ length: maxLen }, (_, i) => headers.map(h => (cols[h] as unknown[])[i]));
    } else {
      headers = options.includeHeader ? (json[0] as string[]) : (json[0] as unknown[]).map((_, i) => `col${i + 1}`);
      rows = options.includeHeader ? (json as unknown[][]).slice(1) : (json as unknown[][]);
    }
  } else if (json && typeof json === "object") {
    headers = Object.keys(json as object);
    rows = [Object.values(json as object)];
  } else {
    throw new Error("Unsupported JSON structure");
  }

  const stringRows = rows.map(row => row.map(v => v === null || v === undefined ? "" : String(v)));
  const csvLines = [headers.join(","), ...stringRows.map(r => r.map(c => c.includes(",") || c.includes('"') || c.includes("\n") ? '"' + c.replace(/"/g, '""') + '"' : c).join(","))];
  const csv = csvLines.join("\n");

  let xlsx: Uint8Array | undefined;
  try {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...stringRows]);
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    xlsx = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  } catch {
    // SheetJS not available or failed
  }

  return { json, csv, xlsx };
}