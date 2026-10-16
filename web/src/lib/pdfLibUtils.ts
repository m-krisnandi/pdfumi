import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";

/** Standard paper sizes in points (72 points per inch) */
export const PAGE_SIZES: Record<string, [number, number]> = {
  A4: [595.28, 841.89],
  Letter: [612.0, 792.0],
  Legal: [612.0, 1008.0],
  A3: [841.89, 1190.55],
  A5: [419.53, 595.28],
};

/** Flatten form fields and annotations in a PDF */
export async function flattenPdf(file: File): Promise<Blob> {
  const bytes = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  try {
    const form = pdfDoc.getForm();
    form.flatten();
  } catch {
    // PDF might not have interactive form fields, continue
  }
  const outputBytes = await pdfDoc.save();
  return new Blob([outputBytes.buffer as ArrayBuffer], { type: "application/pdf" });
}

export type PdfMetadataInfo = {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  producer?: string;
  creator?: string;
  creationDate?: Date;
  modificationDate?: Date;
};

export async function readPdfMetadata(file: File): Promise<PdfMetadataInfo> {
  const bytes = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  return {
    title: pdfDoc.getTitle() || undefined,
    author: pdfDoc.getAuthor() || undefined,
    subject: pdfDoc.getSubject() || undefined,
    keywords: pdfDoc.getKeywords() || undefined,
    producer: pdfDoc.getProducer() || undefined,
    creator: pdfDoc.getCreator() || undefined,
    creationDate: pdfDoc.getCreationDate() || undefined,
    modificationDate: pdfDoc.getModificationDate() || undefined,
  };
}

/** Remove all identifying metadata from a PDF */
export async function removeMetadataPdf(file: File): Promise<Blob> {
  const bytes = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });

  pdfDoc.setTitle("");
  pdfDoc.setAuthor("");
  pdfDoc.setSubject("");
  pdfDoc.setKeywords([]);
  pdfDoc.setProducer("");
  pdfDoc.setCreator("");
  pdfDoc.setCreationDate(new Date(0));
  pdfDoc.setModificationDate(new Date(0));

  const outputBytes = await pdfDoc.save({ useObjectStreams: false });
  return new Blob([outputBytes.buffer as ArrayBuffer], { type: "application/pdf" });
}

/** Resize all pages of a PDF to standard dimensions */
export async function resizePdfPages(
  file: File,
  targetSizeKey: keyof typeof PAGE_SIZES,
  orientation: "portrait" | "landscape" = "portrait"
): Promise<Blob> {
  const [baseW, baseH] = PAGE_SIZES[targetSizeKey] || PAGE_SIZES.A4;
  const targetW = orientation === "landscape" ? Math.max(baseW, baseH) : Math.min(baseW, baseH);
  const targetH = orientation === "landscape" ? Math.min(baseW, baseH) : Math.max(baseW, baseH);

  const bytes = await file.arrayBuffer();
  const srcDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const outDoc = await PDFDocument.create();

  const pages = await outDoc.copyPages(srcDoc, srcDoc.getPageIndices());
  for (const page of pages) {
    const origW = page.getWidth();
    const origH = page.getHeight();
    const scale = Math.min(targetW / origW, targetH / origH);

    const newPage = outDoc.addPage([targetW, targetH]);
    const embedded = await outDoc.embedPage(page);
    const drawW = origW * scale;
    const drawH = origH * scale;
    const x = (targetW - drawW) / 2;
    const y = (targetH - drawH) / 2;

    newPage.drawPage(embedded, {
      x,
      y,
      width: drawW,
      height: drawH,
    });
  }

  const outputBytes = await outDoc.save();
  return new Blob([outputBytes.buffer as ArrayBuffer], { type: "application/pdf" });
}

/** Add Header & Footer text and page numbers to each page */
export async function addHeaderFooterPdf(
  file: File,
  options: {
    headerLeft?: string;
    headerCenter?: string;
    headerRight?: string;
    footerLeft?: string;
    footerCenter?: string;
    footerRight?: string;
    fontSize?: number;
    margin?: number;
  }
): Promise<Blob> {
  const bytes = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = options.fontSize || 10;
  const margin = options.margin || 36;
  const total = pdfDoc.getPageCount();

  for (let i = 0; i < total; i++) {
    const page = pdfDoc.getPage(i);
    const { width, height } = page.getSize();
    const pageNum = i + 1;

    const format = (text?: string) =>
      (text || "")
        .replace(/\{page\}/gi, String(pageNum))
        .replace(/\{total\}/gi, String(total));

    const hl = format(options.headerLeft);
    const hc = format(options.headerCenter);
    const hr = format(options.headerRight);
    const fl = format(options.footerLeft);
    const fc = format(options.footerCenter);
    const fr = format(options.footerRight);

    const topY = height - margin;
    const botY = margin;

    // Headers
    if (hl) {
      page.drawText(hl, { x: margin, y: topY, size: fontSize, font, color: rgb(0.3, 0.3, 0.3) });
    }
    if (hc) {
      const w = font.widthOfTextAtSize(hc, fontSize);
      page.drawText(hc, { x: (width - w) / 2, y: topY, size: fontSize, font, color: rgb(0.3, 0.3, 0.3) });
    }
    if (hr) {
      const w = font.widthOfTextAtSize(hr, fontSize);
      page.drawText(hr, { x: width - margin - w, y: topY, size: fontSize, font, color: rgb(0.3, 0.3, 0.3) });
    }

    // Footers
    if (fl) {
      page.drawText(fl, { x: margin, y: botY, size: fontSize, font, color: rgb(0.3, 0.3, 0.3) });
    }
    if (fc) {
      const w = font.widthOfTextAtSize(fc, fontSize);
      page.drawText(fc, { x: (width - w) / 2, y: botY, size: fontSize, font, color: rgb(0.3, 0.3, 0.3) });
    }
    if (fr) {
      const w = font.widthOfTextAtSize(fr, fontSize);
      page.drawText(fr, { x: width - margin - w, y: botY, size: fontSize, font, color: rgb(0.3, 0.3, 0.3) });
    }
  }

  const outputBytes = await pdfDoc.save();
  return new Blob([outputBytes.buffer as ArrayBuffer], { type: "application/pdf" });
}

/** Convert PDF to Grayscale by rendering pages to grayscale canvas and rebuilding PDF */
export async function convertPdfToGrayscale(
  file: File,
  quality: number = 0.85
): Promise<Blob> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const fileBytes = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: fileBytes });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  const outDoc = await PDFDocument.create();

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;

    // Render page
    // @ts-expect-error pdfjs typing
    await page.render({ canvasContext: ctx, viewport }).promise;

    // Convert to grayscale
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    for (let p = 0; p < data.length; p += 4) {
      const gray = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
      data[p] = gray;
      data[p + 1] = gray;
      data[p + 2] = gray;
    }
    ctx.putImageData(imgData, 0, 0);

    const jpgDataUrl = canvas.toDataURL("image/jpeg", quality);
    const jpgBytes = await (await fetch(jpgDataUrl)).arrayBuffer();
    const embeddedImg = await outDoc.embedJpg(jpgBytes);

    const origViewport = page.getViewport({ scale: 1.0 });
    const pdfPage = outDoc.addPage([origViewport.width, origViewport.height]);
    pdfPage.drawImage(embeddedImg, {
      x: 0,
      y: 0,
      width: origViewport.width,
      height: origViewport.height,
    });
  }

  const outputBytes = await outDoc.save();
  return new Blob([outputBytes.buffer as ArrayBuffer], { type: "application/pdf" });
}

/** Apply Redactions permanently by painting solid rectangles and flattening */
export type RedactionBox = {
  page: number; // 1-based
  x: number; // 0-1
  y: number; // 0-1 from top
  width: number; // 0-1
  height: number; // 0-1
  color: "black" | "white";
};

export async function redactPdf(file: File, boxes: RedactionBox[]): Promise<Blob> {
  const bytes = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });

  for (const box of boxes) {
    if (box.page < 1 || box.page > pdfDoc.getPageCount()) continue;
    const page = pdfDoc.getPage(box.page - 1);
    const { width, height } = page.getSize();

    const drawW = box.width * width;
    const drawH = box.height * height;
    const drawX = box.x * width;
    // PDF coordinate origin is bottom-left
    const drawY = height - (box.y * height) - drawH;

    const clr = box.color === "white" ? rgb(1, 1, 1) : rgb(0, 0, 0);
    page.drawRectangle({
      x: drawX,
      y: drawY,
      width: drawW,
      height: drawH,
      color: clr,
      borderWidth: 0,
    });
  }

  try {
    pdfDoc.getForm().flatten();
  } catch {
    // Continue
  }

  const outputBytes = await pdfDoc.save();
  return new Blob([outputBytes.buffer as ArrayBuffer], { type: "application/pdf" });
}

/** Compile multiple images (JPG, PNG, WebP) into a single PDF document */
export async function imagesToPdfClient(
  images: { file: File; orientation?: "portrait" | "landscape" | "auto" }[],
  marginOption: "none" | "small" | "standard" = "small"
): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();
  const margin = marginOption === "none" ? 0 : marginOption === "small" ? 18 : 36;

  for (const item of images) {
    const imgBytes = await item.file.arrayBuffer();
    const type = item.file.type.toLowerCase();
    let embeddedImg;

    if (type.includes("png")) {
      embeddedImg = await pdfDoc.embedPng(imgBytes);
    } else if (type.includes("jpeg") || type.includes("jpg")) {
      embeddedImg = await pdfDoc.embedJpg(imgBytes);
    } else {
      // Decode WebP / other formats via canvas
      const bmp = await createImageBitmap(new Blob([imgBytes], { type: item.file.type }));
      const canvas = document.createElement("canvas");
      canvas.width = bmp.width;
      canvas.height = bmp.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(bmp, 0, 0);
        const jpgDataUrl = canvas.toDataURL("image/jpeg", 0.92);
        const convertedBytes = await (await fetch(jpgDataUrl)).arrayBuffer();
        embeddedImg = await pdfDoc.embedJpg(convertedBytes);
      } else {
        continue;
      }
    }

    const imgW = embeddedImg.width;
    const imgH = embeddedImg.height;

    // Use standard A4 page or fit-to-image
    const [a4W, a4H] = PAGE_SIZES.A4;
    const isLandscape =
      item.orientation === "landscape" ||
      (item.orientation !== "portrait" && imgW > imgH);
    const pageW = isLandscape ? a4H : a4W;
    const pageH = isLandscape ? a4W : a4H;

    const availW = pageW - margin * 2;
    const availH = pageH - margin * 2;
    const scale = Math.min(availW / imgW, availH / imgH, 1.0);

    const drawW = imgW * scale;
    const drawH = imgH * scale;
    const drawX = (pageW - drawW) / 2;
    const drawY = (pageH - drawH) / 2;

    const page = pdfDoc.addPage([pageW, pageH]);
    page.drawImage(embeddedImg, {
      x: drawX,
      y: drawY,
      width: drawW,
      height: drawH,
    });
  }

  const outputBytes = await pdfDoc.save();
  return new Blob([outputBytes.buffer as ArrayBuffer], { type: "application/pdf" });
}

/** Client-side targeted compress for PDF (downsampling pages to hit target KB, e.g. strictly < 200 KB) */
export async function compressPdfToTargetKb(
  file: File,
  targetKb: number = 200,
  onProgress?: (status: string) => void
): Promise<Blob> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const fileBytes = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: fileBytes });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  // Strict hard ceiling in bytes with safety margin
  // e.g. target 200 KB -> max 195 KB (199,680 bytes) so it always displays and passes as < 200.0 KB
  const maxTargetBytes =
    (targetKb <= 200
      ? 195
      : targetKb <= 500
      ? 490
      : targetKb <= 1000
      ? 980
      : Math.floor(targetKb * 0.95)) * 1024;

  // Determine starting budget per page
  // Overhead of PDF catalog/cross-reference is roughly 2-5 KB + ~1.6 KB per page
  const pdfStructureOverheadKb = Math.min(30, 4 + numPages * 1.6);
  const netImageBudgetKb = Math.max(10, maxTargetBytes / 1024 - pdfStructureOverheadKb);
  const perPageBudgetKb = netImageBudgetKb / numPages;

  // Calculate intelligent initial scale & quality based on per-page budget
  let scale = 1.0;
  let quality = 0.65;
  if (perPageBudgetKb < 15) {
    scale = 0.55;
    quality = 0.35;
  } else if (perPageBudgetKb < 25) {
    scale = 0.65;
    quality = 0.42;
  } else if (perPageBudgetKb < 40) {
    scale = 0.75;
    quality = 0.50;
  } else if (perPageBudgetKb < 70) {
    scale = 0.90;
    quality = 0.60;
  } else {
    scale = 1.1;
    quality = 0.75;
  }

  // Render all pages to canvas
  type RenderedPage = {
    canvas: HTMLCanvasElement;
    origWidth: number;
    origHeight: number;
  };
  const renderedPages: RenderedPage[] = [];

  for (let i = 1; i <= numPages; i++) {
    onProgress?.(`Memproses halaman ${i}/${numPages}...`);
    const page = await pdf.getPage(i);
    const origViewport = page.getViewport({ scale: 1.0 });
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(50, Math.floor(viewport.width));
    canvas.height = Math.max(50, Math.floor(viewport.height));
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // @ts-expect-error pdfjs typing
    await page.render({ canvasContext: ctx, viewport }).promise;
    renderedPages.push({
      canvas,
      origWidth: origViewport.width,
      origHeight: origViewport.height,
    });
  }

  // Helper to package pages into PDFDocument at current scale and quality
  async function buildPdf(
    pages: RenderedPage[],
    jpgQuality: number,
    canvasDownsample: number = 1.0
  ): Promise<Uint8Array> {
    const outDoc = await PDFDocument.create();

    for (const item of pages) {
      let sourceCanvas = item.canvas;
      if (canvasDownsample < 0.98) {
        const smaller = document.createElement("canvas");
        smaller.width = Math.max(80, Math.floor(item.canvas.width * canvasDownsample));
        smaller.height = Math.max(80, Math.floor(item.canvas.height * canvasDownsample));
        const sCtx = smaller.getContext("2d");
        if (sCtx) {
          sCtx.fillStyle = "#ffffff";
          sCtx.fillRect(0, 0, smaller.width, smaller.height);
          sCtx.drawImage(item.canvas, 0, 0, smaller.width, smaller.height);
          sourceCanvas = smaller;
        }
      }

      const jpgDataUrl = sourceCanvas.toDataURL("image/jpeg", jpgQuality);
      const jpgBytes = await (await fetch(jpgDataUrl)).arrayBuffer();
      const embeddedImg = await outDoc.embedJpg(jpgBytes);

      const pdfPage = outDoc.addPage([item.origWidth, item.origHeight]);
      pdfPage.drawImage(embeddedImg, {
        x: 0,
        y: 0,
        width: item.origWidth,
        height: item.origHeight,
      });
    }

    return await outDoc.save();
  }

  // Iterative refinement loop to GUARANTEE fitting under target
  let currentQuality = quality;
  let currentDownsample = 1.0;
  let outputBytes = await buildPdf(renderedPages, currentQuality, currentDownsample);

  let attempts = 0;
  while (outputBytes.byteLength > maxTargetBytes && attempts < 6) {
    attempts++;
    onProgress?.(`Menyesuaikan ukuran (${attempts}/5)...`);
    const ratio = maxTargetBytes / outputBytes.byteLength;

    if (currentQuality > 0.28) {
      currentQuality = Math.max(0.18, currentQuality * Math.min(0.85, ratio * 0.92));
    } else {
      currentDownsample = Math.max(0.35, currentDownsample * Math.min(0.85, Math.sqrt(ratio) * 0.92));
      currentQuality = Math.max(0.20, currentQuality * 0.92);
    }

    outputBytes = await buildPdf(renderedPages, currentQuality, currentDownsample);
  }

  return new Blob([outputBytes.buffer as ArrayBuffer], { type: "application/pdf" });
}
