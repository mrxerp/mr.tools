export interface SplitOptions {
  mode: "column" | "rows";
  columnName?: string;
  rowsPerFile?: number;
  includeHeader: boolean;
  outputFormat: "csv" | "xlsx";
}

export interface SplitFile {
  name: string;
  data: string | Uint8Array;
  isCsv: boolean;
}

export interface SplitResult {
  files: SplitFile[];
  totalRows: number;
  partCount: number;
}

function detectDelimiter(text: string): string {
  const delimiters = [",", "\t", ";", "|"];
  const firstLine = text.split(/\r?\n/)[0] || "";
  let bestDelim = ",";
  let maxCount = 0;
  for (const d of delimiters) {
    const count = (firstLine.match(new RegExp(d.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
    if (count > maxCount) {
      maxCount = count;
      bestDelim = d;
    }
  }
  return bestDelim;
}

function parseCSV(text: string, delimiter: string): { headers: string[]; rows: string[][] } {
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
          currentField += '"';
          j += 2;
          continue;
        }
        inQuotes = !inQuotes;
        j++;
      } else if (ch === delimiter && !inQuotes) {
        currentRow.push(currentField);
        currentField = "";
        j++;
      } else {
        currentField += ch;
        j++;
      }
    }
    if (!inQuotes) {
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = "";
      i++;
    } else {
      currentField += "\n";
      i++;
    }
  }
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }
  const headers = rows[0] || [];
  const dataRows = rows.slice(1);
  return { headers, rows: dataRows };
}

function stringifyCSV(headers: string[], rows: string[][]): string {
  const escape = (field: string) => {
    if (field.includes(",") || field.includes('"') || field.includes("\n") || field.includes("\r")) {
      return '"' + field.replace(/"/g, '""') + '"';
    }
    return field;
  };
  const lines = [headers.map(escape).join(",")];
  for (const row of rows) {
    lines.push(row.map(escape).join(","));
  }
  return lines.join("\n");
}

export async function splitSpreadsheet(
  input: string | Uint8Array,
  options: SplitOptions,
  isXlsx: boolean
): Promise<SplitResult> {
  let headers: string[];
  let rows: string[][];

  if (isXlsx) {
    const XLSX = await import("xlsx");
    const workbook = XLSX.read(input, { type: isXlsx ? "array" : "string" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" }) as string[][];
    headers = json[0] || [];
    rows = json.slice(1);
  } else {
    const text = typeof input === "string" ? input : new TextDecoder().decode(input);
    const delimiter = detectDelimiter(text);
    const parsed = parseCSV(text, delimiter);
    headers = parsed.headers;
    rows = parsed.rows;
  }

  const files: SplitFile[] = [];
  const totalRows = rows.length;

  if (options.mode === "column") {
    const colIndex = headers.indexOf(options.columnName || "");
    if (colIndex < 0) throw new Error(`Column "${options.columnName}" not found`);
    const groups = new Map<string, string[][]>();
    for (const row of rows) {
      const key = row[colIndex] || "(empty)";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(row);
    }
    for (const [key, groupRows] of groups) {
      const safeKey = key.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
      const csv = stringifyCSV(headers, groupRows);
      files.push({
        name: `part_${safeKey}.csv`,
        data: csv,
        isCsv: true,
      });
    }
  } else {
    const perFile = Math.max(1, options.rowsPerFile || 1000);
    const headerRow = options.includeHeader ? headers : null;
    for (let i = 0; i < rows.length; i += perFile) {
      const chunk = rows.slice(i, i + perFile);
      const partHeaders = headerRow || headers;
      const csv = stringifyCSV(partHeaders, chunk);
      files.push({
        name: `part_${Math.floor(i / perFile) + 1}.csv`,
        data: csv,
        isCsv: true,
      });
    }
  }

  return { files, totalRows, partCount: files.length };
}

export async function createZip(files: SplitFile[]): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const localFiles: Uint8Array[] = [];
  const centralDirectory: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const dataBytes = file.isCsv && typeof file.data === "string"
      ? encoder.encode(file.data)
      : file.data instanceof Uint8Array
        ? file.data
        : encoder.encode(String(file.data));

    const crc32 = 0;
    const header = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(header.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 0, true);
    view.setUint16(8, 0, true);
    view.setUint16(10, 0, true);
    view.setUint32(12, crc32, true);
    view.setUint32(16, dataBytes.length, true);
    view.setUint32(20, dataBytes.length, true);
    view.setUint16(24, nameBytes.length, true);
    view.setUint16(26, 0, true);
    header.set(nameBytes, 30);

    localFiles.push(header);
    localFiles.push(dataBytes);

    const cdHeader = new Uint8Array(46 + nameBytes.length);
    const cdView = new DataView(cdHeader.buffer);
    cdView.setUint32(0, 0x02014b50, true);
    cdView.setUint16(4, 45, true);
    cdView.setUint16(6, 20, true);
    cdView.setUint16(8, 0, true);
    cdView.setUint16(10, 0, true);
    cdView.setUint16(12, 0, true);
    cdView.setUint32(14, crc32, true);
    cdView.setUint32(16, dataBytes.length, true);
    cdView.setUint32(20, dataBytes.length, true);
    cdView.setUint16(24, nameBytes.length, true);
    cdView.setUint16(26, 0, true);
    cdView.setUint16(28, 0, true);
    cdView.setUint16(30, 0, true);
    cdView.setUint16(32, 0, true);
    cdView.setUint32(42, offset, true);
    cdHeader.set(nameBytes, 46);
    centralDirectory.push(cdHeader);
    offset += 30 + nameBytes.length + dataBytes.length;
  }

  const centralDirData = new Uint8Array(centralDirectory.reduce((a, b) => a + b.length, 0));
  let pos = 0;
  for (const c of centralDirectory) { centralDirData.set(c, pos); pos += c.length; }

  const endOfCentralDir = new Uint8Array(22);
  const endView = new DataView(endOfCentralDir.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(4, 0, true);
  endView.setUint16(6, 0, true);
  endView.setUint16(8, files.length, true);
  endView.setUint16(10, files.length, true);
  endView.setUint32(12, centralDirData.length, true);
  endView.setUint32(16, centralDirData.length + offset, true);
  endView.setUint16(20, 0, true);

  const localFileData = new Uint8Array(localFiles.reduce((a, b) => a + b.length, 0));
  pos = 0;
  for (const c of localFiles) { localFileData.set(c, pos); pos += c.length; }

  const zip = new Uint8Array(localFileData.length + centralDirData.length + endOfCentralDir.length);
  zip.set(localFileData, 0);
  zip.set(centralDirData, localFileData.length);
  zip.set(endOfCentralDir, localFileData.length + centralDirData.length);

  return zip;
}