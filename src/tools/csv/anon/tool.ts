export interface AnonOptions {
  profiles: ColumnProfile[];
  customPatterns: CustomPattern[];
}

export interface ColumnProfile {
  column: string;
  type: "email" | "phone" | "name" | "id" | "address" | "ssn" | "credit-card" | "custom" | "none";
  customPattern?: string;
  preserveDomain?: boolean;
  preserveFormat?: boolean;
}

export interface CustomPattern {
  name: string;
  pattern: string;
  replacement: (match: string) => string;
}

export interface AnonResult {
  headers: string[];
  rows: string[][];
  anomalies: AnonAnomaly[];
  stats: {
    totalCells: number;
    maskedCells: number;
    columnsProcessed: number;
  };
}

export interface AnonAnomaly {
  row: number;
  col: number;
  colName: string;
  original: string;
  masked: string;
  type: string;
}

const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
const PHONE_RE = /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g;
const SSN_RE = /\b\d{3}-\d{2}-\d{4}\b/g;
const CREDIT_CARD_RE = /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g;
const NAME_RE = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;

const FAKE_DOMAINS = ["example.com", "test.org", "demo.net", "sample.io", "mock.dev"];
const FAKE_FIRST = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth"];
const FAKE_LAST = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"];

function fakeEmail(original: string, preserveDomain: boolean): string {
  const at = original.indexOf("@");
  const domain = preserveDomain && at > 0 ? original.slice(at) : `@${FAKE_DOMAINS[Math.floor(Math.random() * FAKE_DOMAINS.length)]}`;
  const local = FAKE_FIRST[Math.floor(Math.random() * FAKE_FIRST.length)].toLowerCase() + "." +
                FAKE_LAST[Math.floor(Math.random() * FAKE_LAST.length)].toLowerCase() +
                Math.floor(Math.random() * 1000);
  return local + domain;
}

function fakePhone(original: string, preserveFormat: boolean): string {
  const digits = original.replace(/\D/g, "");
  const area = String(Math.floor(Math.random() * 900) + 100);
  const exchange = String(Math.floor(Math.random() * 900) + 100);
  const line = String(Math.floor(Math.random() * 9000) + 1000).padStart(4, "0");
  if (!preserveFormat) return `(${area}) ${exchange}-${line}`;
  if (original.includes("(")) return `(${area}) ${exchange}-${line}`;
  if (original.includes("-")) return `${area}-${exchange}-${line}`;
  if (original.includes(".")) return `${area}.${exchange}.${line}`;
  if (original.includes(" ")) return `${area} ${exchange} ${line}`;
  return `(${area}) ${exchange}-${line}`;
}

function fakeName(): string {
  return `${FAKE_FIRST[Math.floor(Math.random() * FAKE_FIRST.length)]} ${FAKE_LAST[Math.floor(Math.random() * FAKE_LAST.length)]}`;
}

function fakeId(original: string): string {
  const letters = original.replace(/[^A-Za-z]/g, "").length;
  const digits = original.replace(/[^0-9]/g, "").length;
  let result = "";
  for (let i = 0; i < letters; i++) result += String.fromCharCode(65 + Math.floor(Math.random() * 26));
  for (let i = 0; i < digits; i++) result += String(Math.floor(Math.random() * 10));
  return result || "ID" + Math.floor(Math.random() * 10000);
}

function fakeAddress(): string {
  const num = Math.floor(Math.random() * 9999) + 1;
  const streets = ["Main St", "Oak Ave", "Elm Dr", "Maple Rd", "Cedar Ln", "Pine Blvd", "Washington St", "Park Ave"];
  const cities = ["Springfield", "Franklin", "Clinton", "Greenville", "Bristol", "Fairview", "Salem", "Madison"];
  const states = ["CA", "NY", "TX", "FL", "IL", "PA", "OH", "GA"];
  return `${num} ${streets[Math.floor(Math.random() * streets.length)]}, ${cities[Math.floor(Math.random() * cities.length)]}, ${states[Math.floor(Math.random() * states.length)]} ${String(Math.floor(Math.random() * 90000) + 10000)}`;
}

function fakeSSN(): string {
  return `${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 90) + 10)}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
}

function fakeCreditCard(): string {
  const groups = [];
  for (let i = 0; i < 4; i++) {
    groups.push(String(Math.floor(Math.random() * 9000) + 1000));
  }
  return groups.join(" ");
}

function detectType(value: string): string {
  if (EMAIL_RE.test(value)) return "email";
  if (PHONE_RE.test(value)) return "phone";
  if (SSN_RE.test(value)) return "ssn";
  if (CREDIT_CARD_RE.test(value)) return "credit-card";
  if (NAME_RE.test(value)) return "name";
  if (/\d{5}(-\d{4})?/.test(value) && value.includes(" ")) return "address";
  if (/^[A-Z0-9]{6,20}$/.test(value.replace(/[-\s]/g, ""))) return "id";
  return "none";
}

function maskValue(value: string, profile: ColumnProfile): { masked: string; type: string } {
  const type = profile.type === "custom" ? detectType(value) : profile.type;
  switch (type) {
    case "email":
      return { masked: fakeEmail(value, profile.preserveDomain || false), type: "email" };
    case "phone":
      return { masked: fakePhone(value, profile.preserveFormat || false), type: "phone" };
    case "name":
      return { masked: fakeName(), type: "name" };
    case "id":
      return { masked: fakeId(value), type: "id" };
    case "address":
      return { masked: fakeAddress(), type: "address" };
    case "ssn":
      return { masked: fakeSSN(), type: "ssn" };
    case "credit-card":
      return { masked: fakeCreditCard(), type: "credit-card" };
    case "custom":
      if (profile.customPattern) {
        try {
          const re = new RegExp(profile.customPattern, "g");
          return { masked: value.replace(re, "[REDACTED]"), type: "custom" };
        } catch {
          return { masked: value, type: "custom" };
        }
      }
      return { masked: value, type: "custom" };
    default:
      return { masked: value, type: "none" };
  }
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

function stringifyCSV(headers: string[], rows: string[][]): string {
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

export async function anonymize(
  input: string | Uint8Array,
  isXlsx: boolean,
  options: AnonOptions
): Promise<AnonResult> {
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

  const anomalies: AnonAnomaly[] = [];
  let maskedCount = 0;
  let columnsProcessed = 0;

  for (const profile of options.profiles) {
    if (profile.type === "none") continue;
    const colIdx = headers.indexOf(profile.column);
    if (colIdx < 0) continue;
    columnsProcessed++;

    for (let r = 0; r < rows.length; r++) {
      const original = rows[r][colIdx] || "";
      if (!original.trim()) continue;
      const { masked, type } = maskValue(original, profile);
      if (masked !== original) {
        anomalies.push({ row: r, col: colIdx, colName: headers[colIdx], original, masked, type });
        rows[r][colIdx] = masked;
        maskedCount++;
      }
    }
  }

  for (const pattern of options.customPatterns) {
    for (let c = 0; c < headers.length; c++) {
      for (let r = 0; r < rows.length; r++) {
        const original = rows[r][c] || "";
        if (!original.trim()) continue;
        try {
          const re = new RegExp(pattern.pattern, "g");
          const masked = original.replace(re, (m) => pattern.replacement(m));
          if (masked !== original) {
            anomalies.push({ row: r, col: c, colName: headers[c], original, masked, type: pattern.name });
            rows[r][c] = masked;
            maskedCount++;
          }
        } catch { }
      }
    }
  }

  return {
    headers,
    rows,
    anomalies,
    stats: {
      totalCells: rows.length * headers.length,
      maskedCells: maskedCount,
      columnsProcessed,
    },
  };
}

export function generateReport(result: AnonResult): string {
  const lines: string[] = [];
  lines.push("ANONYMIZATION REPORT");
  lines.push("=".repeat(40));
  lines.push(`Columns processed: ${result.stats.columnsProcessed}`);
  lines.push(`Total cells: ${result.stats.totalCells}`);
  lines.push(`Cells masked: ${result.stats.maskedCells}`);
  lines.push("");

  if (result.anomalies.length > 0) {
    lines.push("MASKED VALUES:");
    lines.push("-".repeat(40));
    const byType = new Map<string, typeof result.anomalies>();
    for (const a of result.anomalies) {
      if (!byType.has(a.type)) byType.set(a.type, []);
      byType.get(a.type)!.push(a);
    }
    for (const [type, items] of byType) {
      lines.push(`\n${type.toUpperCase()} (${items.length}):`);
      for (const a of items.slice(0, 100)) {
        lines.push(`  Row ${a.row + 1}, ${a.colName}: "${a.original}" → "${a.masked}"`);
      }
      if (items.length > 100) lines.push(`  ... and ${items.length - 100} more`);
    }
  }

  return lines.join("\n");
}