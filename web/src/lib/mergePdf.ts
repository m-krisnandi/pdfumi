import { PDFDocument, degrees as pdfDegrees } from "pdf-lib";
import { normDeg } from "@/lib/fileRotate";

/** Client-side merge for live preview (order matches UI). Download still goes through API. */
export async function mergePdfFiles(files: File[], rotations: number[] = []): Promise<Blob> {
  const merged = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const bytes = await file.arrayBuffer();
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const rot = normDeg(rotations[i] ?? 0);
    if (rot) {
      for (const page of doc.getPages()) {
        page.setRotation(pdfDegrees(page.getRotation().angle + rot));
      }
    }
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    pages.forEach((page) => merged.addPage(page));
  }

  const output = await merged.save();
  return new Blob([output.buffer as ArrayBuffer], { type: "application/pdf" });
}
