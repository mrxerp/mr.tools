import { PDFDocument } from "pdf-lib";

export type PdfBytes = ArrayBuffer | Uint8Array;

export async function unlockPdf(bytes: PdfBytes, _password: string): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  if (doc.isEncrypted) {
    throw new Error(
      "This PDF is password-protected. The bundled PDF library (pdf-lib) cannot decrypt encrypted documents, so mr unlock cannot remove its password.",
    );
  }
  return doc.save();
}
