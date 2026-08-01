import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export interface NoteColor {
  r: number;
  g: number;
  b: number;
}

export interface Note {
  page: number;
  x: number;
  y: number;
  text: string;
  size?: number;
  color?: NoteColor;
}

export interface NormalizedNote {
  page: number;
  x: number;
  y: number;
  text: string;
  size: number;
  color: NoteColor;
}

export function hexToRgb(hex: string): NoteColor {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return { r: 0, g: 0, b: 0 };
  const n = parseInt(m[1], 16);
  return { r: ((n >> 16) & 0xff) / 255, g: ((n >> 8) & 0xff) / 255, b: (n & 0xff) / 255 };
}

export function normalizeNotes(notes: Note[], pageCount: number): NormalizedNote[] {
  const out: NormalizedNote[] = [];
  for (const note of notes) {
    if (!note.text || !note.text.trim()) continue;
    if (!isFinite(note.page) || !isFinite(note.x) || !isFinite(note.y)) continue;
    const color = {
      r: clamp(note.color?.r ?? 0, 0, 1),
      g: clamp(note.color?.g ?? 0, 0, 1),
      b: clamp(note.color?.b ?? 0, 0, 1),
    };
    const size = note.size !== undefined && isFinite(note.size) ? clamp(note.size, 4, 120) : 12;
    out.push({
      page: clamp(Math.floor(note.page), 1, pageCount),
      x: Math.max(0, note.x),
      y: Math.max(0, note.y),
      text: note.text.trim(),
      size,
      color,
    });
  }
  return out;
}

export async function annotatePdf(
  bytes: ArrayBuffer | Uint8Array,
  notes: Note[],
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const pages = pdf.getPages();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  for (const note of normalizeNotes(notes, pages.length)) {
    const page = pages[note.page - 1];
    const { height } = page.getSize();
    const y = Math.min(note.y, height - note.size);
    page.drawText(note.text, {
      x: note.x,
      y,
      size: note.size,
      font,
      color: rgb(note.color.r, note.color.g, note.color.b),
    });
  }
  return pdf.save();
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(Math.max(v, lo), hi);
}
