/** Client-side file download helpers. */

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
