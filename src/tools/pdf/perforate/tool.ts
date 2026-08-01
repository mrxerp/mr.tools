import { PDFDocument } from "pdf-lib";

export type PdfBytes = ArrayBuffer | Uint8Array;

export type CutAxis = "vertical" | "horizontal";

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function displayToUser(X: number, Y: number, W: number, H: number, rot: number): [number, number] {
  switch (rot) {
    case 90:
      return [Y, H - X];
    case 180:
      return [W - X, H - Y];
    case 270:
      return [W - Y, X];
    default:
      return [X, Y];
  }
}

export function cutCrops(
  axis: CutAxis,
  width: number,
  height: number,
  rotation: number,
): CropRect[] {
  const rot = ((rotation % 360) + 360) % 360;
  const landscape = rot === 90 || rot === 270;
  const dispW = landscape ? height : width;
  const dispH = landscape ? width : height;
  const halves =
    axis === "vertical"
      ? [
          { x: 0, y: 0, width: dispW / 2, height: dispH },
          { x: dispW / 2, y: 0, width: dispW / 2, height: dispH },
        ]
      : [
          { x: 0, y: 0, width: dispW, height: dispH / 2 },
          { x: 0, y: dispH / 2, width: dispW, height: dispH / 2 },
        ];
  return halves.map((half) => {
    const corners = [
      [half.x, half.y],
      [half.x + half.width, half.y],
      [half.x, half.y + half.height],
      [half.x + half.width, half.y + half.height],
    ].map(([X, Y]) => displayToUser(X, Y, width, height, rot));
    const xs = corners.map((c) => c[0]);
    const ys = corners.map((c) => c[1]);
    const x = Math.min(...xs);
    const y = Math.min(...ys);
    return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
  });
}

export async function perforate(bytes: PdfBytes, axis: CutAxis): Promise<Uint8Array> {
  const source = await PDFDocument.load(bytes);
  const total = source.getPageCount();
  if (total === 0) throw new Error("This PDF has no pages.");
  const out = await PDFDocument.create();
  for (let i = 0; i < total; i++) {
    const page = source.getPage(i);
    const media = page.getMediaBox();
    const rotation = page.getRotation().angle;
    const halves = cutCrops(axis, media.width, media.height, rotation);
    const copies = await out.copyPages(source, [i, i]);
    halves.forEach((c, j) => {
      const x = media.x + c.x;
      const y = media.y + c.y;
      copies[j].setMediaBox(x, y, c.width, c.height);
      copies[j].setCropBox(x, y, c.width, c.height);
      copies[j].setBleedBox(x, y, c.width, c.height);
      copies[j].setTrimBox(x, y, c.width, c.height);
      copies[j].setArtBox(x, y, c.width, c.height);
      out.addPage(copies[j]);
    });
  }
  return out.save();
}
