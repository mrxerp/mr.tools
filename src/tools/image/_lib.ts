/** Browser-only image helpers shared by the image family pages. */

export interface LoadedImage {
  bitmap: ImageBitmap;
  width: number;
  height: number;
}

export async function loadImageBitmap(file: File): Promise<LoadedImage> {
  const bitmap = await createImageBitmap(file);
  return { bitmap, width: bitmap.width, height: bitmap.height };
}

export function drawScaled(
  canvas: HTMLCanvasElement,
  bitmap: ImageBitmap,
  width: number,
  height: number,
): void {
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error(`Could not encode image as ${type}`))),
      type,
      quality,
    );
  });
}
