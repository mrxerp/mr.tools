export interface CompareOptions {
  ignoreCase: boolean;
  trimWhitespace: boolean;
  treatEmptyAsEqual: boolean;
}

export interface CellDiff {
  row: number;
  col: number;
  a: string;
  b: string;
  match: boolean;
}

export interface CompareResult {
  diffs: CellDiff[];
  onlyInA: { row: number; data: string[] }[];
  onlyInB: { row: number; data: string[] }[];
  stats: {
    totalCells: number;
    matches: number;
    mismatches: number;
    onlyA: number;
    onlyB: number;
  };
  dims: { rows: number; cols: number };
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

function normalizeCell(cell: string, opts: CompareOptions): string {
  let c = cell;
  if (opts.trimWhitespace) c = c.trim();
  if (opts.ignoreCase) c = c.toLowerCase();
  if (opts.treatEmptyAsEqual && c === "") c = "";
  return c;
}

export async function compareSpreadsheets(
  inputA: string | Uint8Array,
  inputB: string | Uint8Array,
  isXlsxA: boolean,
  isXlsxB: boolean,
  options: CompareOptions
): Promise<CompareResult> {
  let rowsA: string[][];
  let rowsB: string[][];

  if (isXlsxA) {
    const XLSX = await import("xlsx");
    const wb = XLSX.read(inputA, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    rowsA = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as string[][];
  } else {
    rowsA = parseCSV(typeof inputA === "string" ? inputA : new TextDecoder().decode(inputA));
  }

  if (isXlsxB) {
    const XLSX = await import("xlsx");
    const wb = XLSX.read(inputB, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    rowsB = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as string[][];
  } else {
    rowsB = parseCSV(typeof inputB === "string" ? inputB : new TextDecoder().decode(inputB));
  }

  const maxRows = Math.max(rowsA.length, rowsB.length);
  const maxCols = Math.max(
    ...rowsA.map(r => r.length),
    ...rowsB.map(r => r.length)
  );

  const diffs: CellDiff[] = [];
  const onlyInA: { row: number; data: string[] }[] = [];
  const onlyInB: { row: number; data: string[] }[] = [];
  let matches = 0, mismatches = 0;

  for (let r = 0; r < maxRows; r++) {
    const rowA = rowsA[r];
    const rowB = rowsB[r];
    const hasA = !!rowA;
    const hasB = !!rowB;

    if (!hasA && hasB) {
      onlyInB.push({ row: r, data: rowB || [] });
      continue;
    }
    if (hasA && !hasB) {
      onlyInA.push({ row: r, data: rowA || [] });
      continue;
    }

    for (let c = 0; c < maxCols; c++) {
      const cellA = normalizeCell(rowA?.[c] || "", options);
      const cellB = normalizeCell(rowB?.[c] || "", options);
      const match = cellA === cellB;
      diffs.push({ row: r, col: c, a: rowA?.[c] || "", b: rowB?.[c] || "", match });
      if (match) matches++; else mismatches++;
    }
  }

  return {
    diffs,
    onlyInA,
    onlyInB,
    stats: {
      totalCells: diffs.length,
      matches,
      mismatches,
      onlyA: onlyInA.length,
      onlyB: onlyInB.length,
    },
    dims: { rows: maxRows, cols: maxCols },
  };
}

export function generateReport(result: CompareResult): string {
  const lines: string[] = [];
  lines.push("SPREADSHEET COMPARISON REPORT");
  lines.push("=".repeat(40));
  lines.push(`Compared grid: ${result.dims.rows} rows × ${result.dims.cols} columns`);
  lines.push(`Total cells compared: ${result.stats.totalCells}`);
  lines.push(`Matches: ${result.stats.matches}`);
  lines.push(`Mismatches: ${result.stats.mismatches}`);
  lines.push(`Rows only in A: ${result.stats.onlyA}`);
  lines.push(`Rows only in B: ${result.stats.onlyB}`);
  lines.push("");

  if (result.stats.mismatches > 0) {
    lines.push("CELL MISMATCHES:");
    lines.push("-".repeat(40));
    for (const d of result.diffs.filter(d => !d.match).slice(0, 100)) {
      lines.push(`Row ${d.row + 1}, Col ${d.col + 1}: A="${d.a}" | B="${d.b}"`);
    }
    if (result.diffs.filter(d => !d.match).length > 100) {
      lines.push(`... and ${result.diffs.filter(d => !d.match).length - 100} more mismatches`);
    }
    lines.push("");
  }

  if (result.onlyInA.length > 0) {
    lines.push("ROWS ONLY IN A:");
    lines.push("-".repeat(40));
    for (const r of result.onlyInA.slice(0, 50)) {
      lines.push(`Row ${r.row + 1}: ${r.data.join(" | ")}`);
    }
    if (result.onlyInA.length > 50) lines.push(`... and ${result.onlyInA.length - 50} more`);
    lines.push("");
  }

  if (result.onlyInB.length > 0) {
    lines.push("ROWS ONLY IN B:");
    lines.push("-".repeat(40));
    for (const r of result.onlyInB.slice(0, 50)) {
      lines.push(`Row ${r.row + 1}: ${r.data.join(" | ")}`);
    }
    if (result.onlyInB.length > 50) lines.push(`... and ${result.onlyInB.length - 50} more`);
  }

  return lines.join("\n");
}