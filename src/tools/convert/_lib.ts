/** Shared utilities for convert family tools. */

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function fileNameOf(value: { name?: string } | string): string {
  if (typeof value === "string") {
    const parts = value.split(/[\\/]/);
    return parts[parts.length - 1] || "file";
  }
  return value.name || "file";
}

export function swapExtension(name: string, ext: string): string {
  const base = name.replace(/\.[^./\\]+$/, "") || "file";
  return `${base}.${ext}`;
}

export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return file.arrayBuffer();
}

export function readFileAsText(file: File): Promise<string> {
  return file.text();
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function downloadText(text: string, filename: string, type = "text/plain"): void {
  downloadBlob(new Blob([text], { type }), filename);
}

export function downloadArrayBuffer(
  buf: ArrayBuffer | Uint8Array,
  filename: string,
  type = "application/octet-stream",
): void {
  const bytes = new Uint8Array(buf instanceof Uint8Array ? buf : buf);
  downloadBlob(new Blob([bytes as BlobPart], { type }), filename);
}