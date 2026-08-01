import { PDFDocument } from "pdf-lib";

export interface ImageInput {
  bytes: Uint8Array;
  mime: string;
}

export type ImgToPdfMode = "pages" | "combined";

export function detectImageType(bytes: Uint8Array): "png" | "jpg" | null {
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  )
    return "png";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return "jpg";
  return null;
}

export async function imagesToPdf(
  images: ImageInput[],
  mode: ImgToPdfMode = "pages",
): Promise<Uint8Array> {
  if (images.length === 0) throw new Error("Choose at least one image.");
  const doc = await PDFDocument.create();
  const embedded = await Promise.all(
    images.map(async (img) => {
      const type = detectImageType(img.bytes) ?? img.mime.replace("image/", "");
      if (type === "png") return { image: await doc.embedPng(img.bytes) };
      if (type === "jpg" || type === "jpeg") return { image: await doc.embedJpg(img.bytes) };
      throw new Error("Unsupported image type — use PNG or JPEG.");
    }),
  );

  if (mode === "pages") {
    for (const { image } of embedded) {
      const page = doc.addPage([image.width, image.height]);
      page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
    }
  } else {
    const width = Math.max(...embedded.map((e) => e.image.width));
    let cursor = 0;
    const laid = embedded.map(({ image }) => {
      const height = Math.round((image.height * width) / image.width);
      const top = cursor;
      cursor += height;
      return { image, width, height, top };
    });
    const page = doc.addPage([width, cursor]);
    for (const item of laid) {
      page.drawImage(item.image, {
        x: 0,
        y: cursor - item.top - item.height,
        width: item.width,
        height: item.height,
      });
    }
  }
  return doc.save();
}
