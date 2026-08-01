/** File reading helpers used across tools. */

export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return file.arrayBuffer();
}

export function readFileAsText(file: File): Promise<string> {
  return file.text();
}

export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/** Extracts a base filename from a File or a "path-like" string. */
export function fileNameOf(value: { name?: string } | string): string {
  if (typeof value === "string") {
    const parts = value.split(/[\\/]/);
    return parts[parts.length - 1] || "file";
  }
  return value.name || "file";
}

/** Picks a safe output filename: strips the extension and appends a suffix. */
export function swapExtension(name: string, ext: string): string {
  const base = name.replace(/\.[^./\\]+$/, "") || "file";
  return `${base}.${ext}`;
}
