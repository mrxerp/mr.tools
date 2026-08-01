export interface StitchOptions {
  mode: "by-name" | "all-sheets" | "first-sheet";
  includeHeader: boolean;
  alignColumns: boolean;
  outputFormat: "xlsx" | "csv";
}

export interface StitchSheet {
  name: string;
  headers: string[];
  rows: string[][];
  sourceFile: string;
}

export interface StitchResult {
  sheets: StitchSheet[];
  combinedHeaders: string[];
  combinedRows: string[][];
  stats: {
    totalFiles: number;
    totalSheets: number;
    totalRows: number;
    columnsInOutput: number;
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

export async function stitchWorkbooks(
  inputs: Array<{ data: string | Uint8Array; isXlsx: boolean; name: string }>,
  options: StitchOptions
): Promise<StitchResult> {
  const allSheets: StitchSheet[] = [];
  let totalRows = 0;

  for (const input of inputs) {
    if (input.isXlsx) {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(input.data, { type: "array" });
      const sheetNames = options.mode === "first-sheet" ? [wb.SheetNames[0]] : wb.SheetNames;

      for (const sheetName of sheetNames) {
        const ws = wb.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as string[][];
        const headers = data[0] || [];
        const rows = data.slice(1);
        allSheets.push({ name: sheetName, headers, rows, sourceFile: input.name });
        totalRows += rows.length;
      }
    } else {
      const text = typeof input.data === "string" ? input.data : new TextDecoder().decode(input.data);
      const data = parseCSV(text);
      const headers = data[0] || [];
      const rows = data.slice(1);
      allSheets.push({ name: "Sheet1", headers, rows, sourceFile: input.name });
      totalRows += rows.length;
    }
  }

  if (allSheets.length === 0) throw new Error("No sheets found in input files");

  let combinedHeaders: string[];
  let combinedRows: string[][];

  if (options.mode === "by-name") {
    const sheetGroups = new Map<string, StitchSheet[]>();
    for (const sheet of allSheets) {
      if (!sheetGroups.has(sheet.name)) sheetGroups.set(sheet.name, []);
      sheetGroups.get(sheet.name)!.push(sheet);
    }

    const firstGroup = sheetGroups.values().next().value;
    if (firstGroup && firstGroup.length > 0) {
      combinedHeaders = options.alignColumns
        ? Array.from(new Set(firstGroup.flatMap(s => s.headers)))
        : firstGroup[0].headers;
    } else {
      combinedHeaders = [];
    }

    combinedRows = [];
    for (const [, sheets] of sheetGroups) {
      for (const sheet of sheets) {
        if (options.alignColumns) {
          const indexMap = combinedHeaders.map(h => sheet.headers.indexOf(h));
          for (const row of sheet.rows) {
            combinedRows.push(indexMap.map(i => i >= 0 ? (row[i] || "") : ""));
          }
        } else {
          combinedRows.push(...sheet.rows);
        }
      }
    }
  } else {
    combinedHeaders = options.alignColumns
      ? Array.from(new Set(allSheets.flatMap(s => s.headers)))
      : allSheets[0].headers;

    combinedRows = [];
    for (const sheet of allSheets) {
      if (options.alignColumns) {
        const indexMap = combinedHeaders.map(h => sheet.headers.indexOf(h));
        for (const row of sheet.rows) {
          combinedRows.push(indexMap.map(i => i >= 0 ? (row[i] || "") : ""));
        }
      } else {
        combinedRows.push(...sheet.rows);
      }
    }
  }

  return {
    sheets: allSheets,
    combinedHeaders,
    combinedRows,
    stats: {
      totalFiles: inputs.length,
      totalSheets: allSheets.length,
      totalRows,
      columnsInOutput: combinedHeaders.length,
    },
  };
}

export async function stitchToXLSX(result: StitchResult, options: StitchOptions): Promise<Uint8Array> {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();

  if (options.mode === "by-name") {
    const sheetGroups = new Map<string, StitchSheet[]>();
    for (const sheet of result.sheets) {
      if (!sheetGroups.has(sheet.name)) sheetGroups.set(sheet.name, []);
      sheetGroups.get(sheet.name)!.push(sheet);
    }

    for (const [name, sheets] of sheetGroups) {
      const alignedHeaders = options.alignColumns ? result.combinedHeaders : sheets[0].headers;
      const rows: string[][] = [];
      for (const sheet of sheets) {
        if (options.alignColumns) {
          const indexMap = alignedHeaders.map(h => sheet.headers.indexOf(h));
          for (const row of sheet.rows) {
            rows.push(indexMap.map(i => i >= 0 ? (row[i] || "") : ""));
          }
        } else {
          rows.push(...sheet.rows);
        }
      }
      const data = options.includeHeader ? [alignedHeaders, ...rows] : rows;
      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
    }
  } else {
    const data = options.includeHeader ? [result.combinedHeaders, ...result.combinedRows] : result.combinedRows;
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Stitched");
  }

  return XLSX.write(wb, { type: "array", bookType: "xlsx" });
}

export function stitchToCSV(result: StitchResult, options: StitchOptions): string {
  return stringifyCSV(
    options.includeHeader ? result.combinedHeaders : [],
    result.combinedRows
  );
}