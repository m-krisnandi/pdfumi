export async function loadPdfJs() {
  const pdfjs = await import("pdfjs-dist");
  if (typeof window !== "undefined") {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  }
  return pdfjs;
}

export function getPdfDocumentParams(data: Uint8Array | ArrayBuffer) {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  return {
    data: bytes,
    cMapUrl: "/cmaps/",
    cMapPacked: true,
    standardFontDataUrl: "/standard_fonts/",
    wasmUrl: "/wasm/",
    disableAutoFetch: true,
    disableStream: true,
  };
}
