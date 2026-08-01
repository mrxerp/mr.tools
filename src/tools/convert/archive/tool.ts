export interface ArchiveEntry {
  name: string;
  size: number;
  compressedSize?: number;
  isDirectory: boolean;
  lastModified?: Date;
}

export interface ArchiveResult {
  entries: ArchiveEntry[];
  format: "zip" | "tar" | "gzip";
  totalSize: number;
  totalCompressedSize?: number;
}

export interface CreateArchiveOptions {
  format: "zip" | "tar" | "gzip";
  files: Array<{ name: string; data: Uint8Array }>;
  password?: string;
  level?: number;
}

export interface ExtractOptions {
  format: "zip" | "tar" | "gzip";
  data: Uint8Array;
  password?: string;
  selectedEntries?: string[];
}

export async function readArchive(data: Uint8Array, format: "zip" | "tar" | "gzip"): Promise<ArchiveResult> {
  switch (format) {
    case "zip":
      return readZip(data);
    case "tar":
      return readTar(data);
    case "gzip":
      return readGzip(data);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

async function readZip(data: Uint8Array): Promise<ArchiveResult> {
  const entries: ArchiveEntry[] = [];
  let offset = 0;
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let totalSize = 0;
  let totalCompressedSize = 0;

  while (offset < data.byteLength) {
    if (offset + 4 > data.byteLength) break;
    const sig = view.getUint32(offset, true);
    if (sig !== 0x04034b50) break;

    if (offset + 30 > data.byteLength) break;
    const version = view.getUint16(offset + 4, true);
    const flags = view.getUint16(offset + 6, true);
    const compression = view.getUint16(offset + 8, true);
    const modTime = view.getUint16(offset + 10, true);
    const modDate = view.getUint16(offset + 12, true);
    const crc32 = view.getUint32(offset + 14, true);
    const compressedSize = view.getUint32(offset + 16, true);
    const uncompressedSize = view.getUint32(offset + 18, true);
    const fileNameLen = view.getUint16(offset + 20, true);
    const extraFieldLen = view.getUint16(offset + 22, true);

    const headerSize = 30 + fileNameLen + extraFieldLen;
    if (offset + headerSize > data.byteLength) break;

    const nameBytes = new Uint8Array(data.buffer, data.byteOffset + offset + 30, fileNameLen);
    const name = new TextDecoder().decode(nameBytes);

    const isDirectory = name.endsWith("/") || (flags & 0x10) !== 0;
    const lastModified = dosDateTimeToDate(modDate, modTime);

    entries.push({
      name,
      size: uncompressedSize,
      compressedSize,
      isDirectory,
      lastModified,
    });

    totalSize += uncompressedSize;
    totalCompressedSize += compressedSize;

    offset += headerSize + compressedSize;
  }

  return { entries, format: "zip", totalSize, totalCompressedSize };
}

async function readTar(data: Uint8Array): Promise<ArchiveResult> {
  const entries: ArchiveEntry[] = [];
  let offset = 0;
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let totalSize = 0;

  while (offset + 512 <= data.byteLength) {
    const nameBytes = new Uint8Array(data.buffer, data.byteOffset + offset, 100);
    const name = new TextDecoder().decode(nameBytes).replace(/\0.*$/, "");

    if (!name) break;

    const sizeStr = new TextDecoder().decode(new Uint8Array(data.buffer, data.byteOffset + offset + 124, 12)).replace(/\0.*$/, "");
    const size = parseInt(sizeStr.trim(), 8) || 0;

    const typeFlag = new Uint8Array(data.buffer, data.byteOffset + offset + 156, 1)[0];
    const isDirectory = typeFlag === 0x35 || name.endsWith("/");

    const modTimeStr = new TextDecoder().decode(new Uint8Array(data.buffer, data.byteOffset + offset + 136, 12)).replace(/\0.*$/, "");
    const modTime = parseInt(modTimeStr.trim(), 8);
    const lastModified = modTime ? new Date(modTime * 1000) : undefined;

    entries.push({
      name,
      size,
      isDirectory,
      lastModified,
    });

    totalSize += size;

    const blocks = Math.ceil((size + 512) / 512);
    offset += blocks * 512;
  }

  return { entries, format: "tar", totalSize };
}

async function readGzip(data: Uint8Array): Promise<ArchiveResult> {
  const stream = new Response(data).body!.pipeThrough(new DecompressionStream("gzip"));
  const decompressed = new Uint8Array(await new Response(stream).arrayBuffer());

  const name = "decompressed";
  return {
    entries: [{ name, size: decompressed.length, isDirectory: false }],
    format: "gzip",
    totalSize: decompressed.length,
  };
}

export async function extractArchive(options: ExtractOptions): Promise<Map<string, Uint8Array>> {
  const { format, data, password, selectedEntries } = options;
  const files = new Map<string, Uint8Array>();

  switch (format) {
    case "zip":
      await extractZip(data, files, password, selectedEntries);
      break;
    case "tar":
      await extractTar(data, files, selectedEntries);
      break;
    case "gzip":
      await extractGzip(data, files);
      break;
    default:
      throw new Error(`Unsupported format: ${format}`);
  }

  return files;
}

async function extractZip(data: Uint8Array, files: Map<string, Uint8Array>, password?: string, selectedEntries?: string[]): Promise<void> {
  let offset = 0;
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

  while (offset < data.byteLength) {
    if (offset + 4 > data.byteLength) break;
    const sig = view.getUint32(offset, true);
    if (sig !== 0x04034b50) break;

    if (offset + 30 > data.byteLength) break;
    const flags = view.getUint16(offset + 6, true);
    const compression = view.getUint16(offset + 8, true);
    const compressedSize = view.getUint32(offset + 16, true);
    const uncompressedSize = view.getUint32(offset + 18, true);
    const fileNameLen = view.getUint16(offset + 20, true);
    const extraFieldLen = view.getUint16(offset + 22, true);

    const headerSize = 30 + fileNameLen + extraFieldLen;
    if (offset + headerSize > data.byteLength) break;

    const nameBytes = new Uint8Array(data.buffer, data.byteOffset + offset + 30, fileNameLen);
    const name = new TextDecoder().decode(nameBytes);

    if (selectedEntries && !selectedEntries.includes(name)) {
      offset += headerSize + compressedSize;
      continue;
    }

    const isEncrypted = (flags & 0x1) !== 0;
    if (isEncrypted && password) {
      throw new Error("Password-protected ZIP extraction requires WebCrypto implementation");
    }

    const fileData = new Uint8Array(data.buffer, data.byteOffset + offset + headerSize, compressedSize);

    let extracted: Uint8Array;
    if (compression === 0) {
      extracted = fileData;
    } else if (compression === 8) {
      const stream = new Response(fileData).body!.pipeThrough(new DecompressionStream("deflate"));
      extracted = new Uint8Array(await new Response(stream).arrayBuffer());
    } else {
      throw new Error(`Unsupported compression method: ${compression}`);
    }

    if (!name.endsWith("/")) {
      files.set(name, extracted);
    }

    offset += headerSize + compressedSize;
  }
}

async function extractTar(data: Uint8Array, files: Map<string, Uint8Array>, selectedEntries?: string[]): Promise<void> {
  let offset = 0;
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

  while (offset + 512 <= data.byteLength) {
    const nameBytes = new Uint8Array(data.buffer, data.byteOffset + offset, 100);
    const name = new TextDecoder().decode(nameBytes).replace(/\0.*$/, "");

    if (!name) break;

    const sizeStr = new TextDecoder().decode(new Uint8Array(data.buffer, data.byteOffset + offset + 124, 12)).replace(/\0.*$/, "");
    const size = parseInt(sizeStr.trim(), 8) || 0;

    const typeFlag = new Uint8Array(data.buffer, data.byteOffset + offset + 156, 1)[0];
    const isDirectory = typeFlag === 0x35 || name.endsWith("/");

    if (selectedEntries && !selectedEntries.includes(name)) {
      const blocks = Math.ceil((size + 512) / 512);
      offset += blocks * 512;
      continue;
    }

    if (!isDirectory && size > 0) {
      const fileData = new Uint8Array(data.buffer, data.byteOffset + offset + 512, size);
      files.set(name, fileData);
    }

    const blocks = Math.ceil((size + 512) / 512);
    offset += blocks * 512;
  }
}

async function extractGzip(data: Uint8Array, files: Map<string, Uint8Array>): Promise<void> {
  const stream = new Response(data).body!.pipeThrough(new DecompressionStream("gzip"));
  const decompressed = new Uint8Array(await new Response(stream).arrayBuffer());
  files.set("decompressed", decompressed);
}

export async function createArchive(options: CreateArchiveOptions): Promise<Uint8Array> {
  const { format, files: fileList, password, level = 6 } = options;

  switch (format) {
    case "zip":
      return createZip(fileList, level, password);
    case "tar":
      return createTar(fileList);
    case "gzip":
      if (fileList.length !== 1) throw new Error("GZIP only supports single file");
      return createGzip(fileList[0].data, level);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

async function createZip(fileList: Array<{ name: string; data: Uint8Array }>, level: number, password?: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];
  let offset = 0;

  for (const file of fileList) {
    const nameBytes = encoder.encode(file.name);
    const header = new ArrayBuffer(30);
    const headerView = new DataView(header);
    headerView.setUint32(0, 0x04034b50, true);
    headerView.setUint16(4, 20, true);
    headerView.setUint16(6, 0, true);
    headerView.setUint16(8, 8, true);
    headerView.setUint16(10, 0, true);
    headerView.setUint16(12, 0, true);
    headerView.setUint32(14, 0, true);
    headerView.setUint32(16, file.data.length, true);
    headerView.setUint32(18, file.data.length, true);
    headerView.setUint16(20, nameBytes.length, true);
    headerView.setUint16(22, 0, true);

    const stream = new Response(file.data).body!.pipeThrough(new CompressionStream("deflate", { level }));
    const compressed = new Uint8Array(await new Response(stream).arrayBuffer());

    headerView.setUint32(16, compressed.length, true);

    parts.push(new Uint8Array(header));
    parts.push(nameBytes);
    parts.push(compressed);
    offset += 30 + nameBytes.length + compressed.length;
  }

  const centralDirParts: Uint8Array[] = [];
  let centralOffset = 0;

  for (const file of fileList) {
    const nameBytes = encoder.encode(file.name);
    const stream = new Response(file.data).body!.pipeThrough(new CompressionStream("deflate", { level }));
    const compressed = new Uint8Array(await new Response(stream).arrayBuffer());

    const centralHeader = new ArrayBuffer(46);
    const centralView = new DataView(centralHeader);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0, true);
    centralView.setUint16(10, 8, true);
    centralView.setUint16(12, 0, true);
    centralView.setUint16(14, 0, true);
    centralView.setUint32(16, 0, true);
    centralView.setUint32(20, compressed.length, true);
    centralView.setUint32(24, file.data.length, true);
    centralView.setUint16(28, nameBytes.length, true);
    centralView.setUint16(30, 0, true);
    centralView.setUint16(32, 0, true);
    centralView.setUint16(34, 0, true);
    centralView.setUint16(36, 0, true);
    centralView.setUint32(38, 0, true);
    centralView.setUint32(42, centralOffset, true);

    centralDirParts.push(new Uint8Array(centralHeader));
    centralDirParts.push(nameBytes);
    centralOffset += 46 + nameBytes.length;
  }

  const endOfCentralDir = new ArrayBuffer(22);
  const endView = new DataView(endOfCentralDir);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(4, 0, true);
  endView.setUint16(6, 0, true);
  endView.setUint16(8, fileList.length, true);
  endView.setUint16(10, fileList.length, true);
  endView.setUint32(12, centralOffset, true);
  endView.setUint32(16, offset, true);
  endView.setUint16(20, 0, true);

  const totalLength = parts.reduce((sum, p) => sum + p.length, 0) +
    centralDirParts.reduce((sum, p) => sum + p.length, 0) + 22;

  const result = new Uint8Array(totalLength);
  let pos = 0;
  for (const p of parts) {
    result.set(p, pos);
    pos += p.length;
  }
  for (const p of centralDirParts) {
    result.set(p, pos);
    pos += p.length;
  }
  result.set(new Uint8Array(endOfCentralDir), pos);

  return result;
}

async function createTar(fileList: Array<{ name: string; data: Uint8Array }>): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];

  for (const file of fileList) {
    const header = new Uint8Array(512);
    const nameBytes = encoder.encode(file.name);
    header.set(nameBytes, 0);

    const sizeStr = file.data.length.toString(8).padStart(11, "0") + " ";
    const sizeBytes = encoder.encode(sizeStr);
    header.set(sizeBytes, 124);

    header[156] = file.name.endsWith("/") ? 0x35 : 0x30;

    const checksum = header.reduce((sum, b) => sum + b, 0);
    const checksumStr = checksum.toString(8).padStart(6, "0") + "\0 ";
    const checksumBytes = encoder.encode(checksumStr);
    header.set(checksumBytes, 148);

    parts.push(header);

    const padding = (512 - (file.data.length % 512)) % 512;
    const fileWithPadding = new Uint8Array(file.data.length + padding);
    fileWithPadding.set(file.data);
    parts.push(fileWithPadding);
  }

  const endPadding = new Uint8Array(1024);
  parts.push(endPadding);

  const totalLength = parts.reduce((sum, p) => sum + p.length, 0);
  const result = new Uint8Array(totalLength);
  let pos = 0;
  for (const p of parts) {
    result.set(p, pos);
    pos += p.length;
  }

  return result;
}

async function createGzip(data: Uint8Array, level: number): Promise<Uint8Array> {
  const stream = new Response(data).body!.pipeThrough(new CompressionStream("gzip", { level }));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function dosDateTimeToDate(date: number, time: number): Date {
  const year = ((date >> 9) & 0x7f) + 1980;
  const month = ((date >> 5) & 0xf) - 1;
  const day = date & 0x1f;
  const hours = (time >> 11) & 0x1f;
  const minutes = (time >> 5) & 0x3f;
  const seconds = (time & 0x1f) * 2;
  return new Date(year, month, day, hours, minutes, seconds);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}