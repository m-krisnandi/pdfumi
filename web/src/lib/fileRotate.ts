/** Normalize degrees to 0, 90, 180, or 270. */
export function normDeg(deg: number): number {
  const d = ((Math.round(deg / 90) * 90) % 360 + 360) % 360;
  return d;
}

/** Rotate an image File by 90° steps; returns a new File (PNG). */
export async function rotateImageFile(file: File, degrees: number): Promise<File> {
  const deg = normDeg(degrees);
  if (deg === 0) return file;

  const url = URL.createObjectURL(file);
  try {
    const img = await loadHtmlImage(url);
    const canvas = document.createElement("canvas");
    const swap = deg === 90 || deg === 270;
    canvas.width = swap ? img.naturalHeight : img.naturalWidth;
    canvas.height = swap ? img.naturalWidth : img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((deg * Math.PI) / 180);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png");
    });
    const base = file.name.replace(/\.[^.]+$/, "") || "image";
    return new File([blob], `${base}.png`, { type: "image/png", lastModified: Date.now() });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadHtmlImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
}

/** Rotate every page of a PDF File by the same amount; returns a new PDF File. */
export async function rotatePdfFile(file: File, degrees: number): Promise<File> {
  const deg = normDeg(degrees);
  if (deg === 0) return file;
  const { PDFDocument, degrees: pdfDegrees } = await import("pdf-lib");
  const bytes = await file.arrayBuffer();
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  for (const page of doc.getPages()) {
    page.setRotation(pdfDegrees(page.getRotation().angle + deg));
  }
  const out = await doc.save();
  return new File([out.buffer as ArrayBuffer], file.name, {
    type: "application/pdf",
    lastModified: Date.now(),
  });
}

/**
 * Build a PDF from selected pages (1-based) with optional per-page extra rotation.
 */
export async function buildPdfFromPages(
  file: File,
  pages1Based: number[],
  rotations: number[] = [],
): Promise<File> {
  const { PDFDocument, degrees: pdfDegrees } = await import("pdf-lib");
  const bytes = await file.arrayBuffer();
  const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const out = await PDFDocument.create();
  for (let i = 0; i < pages1Based.length; i++) {
    const pageNo = pages1Based[i];
    const [copied] = await out.copyPages(src, [pageNo - 1]);
    const extra = normDeg(rotations[i] ?? 0);
    if (extra) {
      copied.setRotation(pdfDegrees(copied.getRotation().angle + extra));
    }
    out.addPage(copied);
  }
  const saved = await out.save();
  return new File([saved.buffer as ArrayBuffer], file.name, {
    type: "application/pdf",
    lastModified: Date.now(),
  });
}
