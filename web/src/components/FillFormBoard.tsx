"use client";

import { loadPdfJs, getPdfDocumentParams } from "@/lib/pdfjsLoader";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ToolShell } from "@/components/ToolShell";
import { PdfDropzone } from "@/components/PdfDropzone";
import { ErrorBanner } from "@/components/ErrorBanner";
import { CreateSignatureModal } from "@/components/CreateSignatureModal";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import {
  Type,
  Check,
  Calendar,
  PenTool,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Download,
  ZoomIn,
  ZoomOut,
  Layers,
  FileCheck,
  Plus,
  Minus,
} from "lucide-react";

export type AnnotationType = "text" | "check" | "cross" | "date" | "signature";

export type FormAnnotation = {
  id: string;
  page: number;
  type: AnnotationType;
  text: string;
  x: number; // 0 to 1 relative to page width
  y: number; // 0 to 1 relative to page height (from top)
  fontSize: number; // in pt
  color: string;
  sigDataUrl?: string;
  sigWidth?: number; // relative 0-1
  sigHeight?: number; // relative 0-1
};

export type AcroField = {
  name: string;
  type: "text" | "checkbox";
  value: string | boolean;
};

const FONT_COLORS = [
  { label: "Hitam", value: "#1a1a1a" },
  { label: "Biru", value: "#1e3a8a" },
  { label: "Merah", value: "#b91c1c" },
];

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return rgb(isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b);
}

function getTodayFormatted(): string {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function FillFormBoard() {
  const t = useTranslations("fillPdf");
  const tSign = useTranslations("signPdf");

  const [file, setFile] = useState<File | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoom, setZoom] = useState(1.0);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  // Active Tool: "text" | "check" | "cross" | "date" | "signature" | "select"
  const [activeTool, setActiveTool] = useState<AnnotationType | "select">("text");
  const [selectedColor, setSelectedColor] = useState("#1a1a1a");
  const [selectedFontSize, setSelectedFontSize] = useState(14);

  // Annotations
  const [annotations, setAnnotations] = useState<FormAnnotation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Interactive AcroForm fields
  const [acroFields, setAcroFields] = useState<AcroField[]>([]);
  const [showAcroPanel, setShowAcroPanel] = useState(false);

  // Signature Modal state
  const [sigModalOpen, setSigModalOpen] = useState(false);
  const [pendingSigPos, setPendingSigPos] = useState<{ x: number; y: number } | null>(null);

  // Dragging state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle file selection & AcroForm scan
  async function handleFile(selected: File) {
    if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
      setError("Pilih file berekstensi .pdf");
      return;
    }

    setFile(selected);
    setCurrentPage(1);
    setAnnotations([]);
    setSelectedId(null);
    setError(null);

    try {
      const bytes = await selected.arrayBuffer();
      const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      setTotalPages(pdfDoc.getPageCount());

      // Check for AcroForm fields
      try {
        const form = pdfDoc.getForm();
        const fields = form.getFields();
        const parsed: AcroField[] = [];
        for (const f of fields) {
          const typeName = f.constructor.name;
          if (typeName.includes("TextField")) {
            const tf = form.getTextField(f.getName());
            parsed.push({
              name: f.getName(),
              type: "text",
              value: tf.getText() || "",
            });
          } else if (typeName.includes("CheckBox")) {
            const cb = form.getCheckBox(f.getName());
            parsed.push({
              name: f.getName(),
              type: "checkbox",
              value: cb.isChecked(),
            });
          }
        }
        setAcroFields(parsed);
        if (parsed.length > 0) {
          setShowAcroPanel(true);
        }
      } catch {
        // PDF has no AcroForm fields, flat form mode is ready
        setAcroFields([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membaca dokumen PDF");
    }
  }

  // Render current page onto canvas
  useEffect(() => {
    if (!file) return;

    let cancelled = false;

    async function renderPage() {
      try {
        const pdfjs = await loadPdfJs();
        const buffer = await file!.arrayBuffer();
        const loadingTask = pdfjs.getDocument(getPdfDocumentParams(buffer));
        const pdf = await loadingTask.promise;

        if (cancelled) return;
        setTotalPages(pdf.numPages);

        const page = await pdf.getPage(currentPage);
        if (cancelled) return;

        const viewport = page.getViewport({ scale: 1.5 * zoom });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await (page.render as unknown as (params: Record<string, unknown>) => { promise: Promise<void> })({
          canvasContext: ctx,
          viewport,
          canvas,
        }).promise;
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Gagal menampilkan halaman PDF");
        }
      }
    }

    renderPage();

    return () => {
      cancelled = true;
    };
  }, [file, currentPage, zoom]);

  // Click on canvas container to place or deselect
  function handleContainerClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!containerRef.current) return;

    if ((e.target as HTMLElement).closest("[data-annotation-id]")) {
      return;
    }

    if (activeTool === "select") {
      setSelectedId(null);
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    if (activeTool === "text") {
      const newAnno: FormAnnotation = {
        id: Math.random().toString(36).substring(2, 9),
        page: currentPage,
        type: "text",
        text: "Ketik di sini",
        x,
        y,
        fontSize: selectedFontSize,
        color: selectedColor,
      };
      setAnnotations((prev) => [...prev, newAnno]);
      setSelectedId(newAnno.id);
    } else if (activeTool === "check") {
      const newAnno: FormAnnotation = {
        id: Math.random().toString(36).substring(2, 9),
        page: currentPage,
        type: "check",
        text: "✓",
        x,
        y,
        fontSize: 18,
        color: selectedColor,
      };
      setAnnotations((prev) => [...prev, newAnno]);
      setSelectedId(newAnno.id);
    } else if (activeTool === "cross") {
      const newAnno: FormAnnotation = {
        id: Math.random().toString(36).substring(2, 9),
        page: currentPage,
        type: "cross",
        text: "✕",
        x,
        y,
        fontSize: 18,
        color: selectedColor,
      };
      setAnnotations((prev) => [...prev, newAnno]);
      setSelectedId(newAnno.id);
    } else if (activeTool === "date") {
      const newAnno: FormAnnotation = {
        id: Math.random().toString(36).substring(2, 9),
        page: currentPage,
        type: "date",
        text: getTodayFormatted(),
        x,
        y,
        fontSize: selectedFontSize,
        color: selectedColor,
      };
      setAnnotations((prev) => [...prev, newAnno]);
      setSelectedId(newAnno.id);
    } else if (activeTool === "signature") {
      setPendingSigPos({ x, y });
      setSigModalOpen(true);
    }
  }

  // Handle signature creation
  function onSignatureCreated(dataUrl: string) {
    if (!pendingSigPos) return;
    const newAnno: FormAnnotation = {
      id: Math.random().toString(36).substring(2, 9),
      page: currentPage,
      type: "signature",
      text: "",
      x: pendingSigPos.x,
      y: pendingSigPos.y,
      fontSize: 14,
      color: selectedColor,
      sigDataUrl: dataUrl,
      sigWidth: 0.22,
      sigHeight: 0.08,
    };
    setAnnotations((prev) => [...prev, newAnno]);
    setSelectedId(newAnno.id);
    setPendingSigPos(null);
    setSigModalOpen(false);
  }

  // Dragging annotations
  function handlePointerDown(e: React.PointerEvent, id: string) {
    e.stopPropagation();
    setSelectedId(id);
    setDraggingId(id);

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const anno = annotations.find((a) => a.id === id);
    if (!anno) return;

    const mouseX = (e.clientX - rect.left) / rect.width;
    const mouseY = (e.clientY - rect.top) / rect.height;

    setDragOffset({
      x: mouseX - anno.x,
      y: mouseY - anno.y,
    });
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!draggingId || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / rect.width;
    const mouseY = (e.clientY - rect.top) / rect.height;

    const newX = Math.max(0, Math.min(0.95, mouseX - dragOffset.x));
    const newY = Math.max(0, Math.min(0.95, mouseY - dragOffset.y));

    setAnnotations((prev) =>
      prev.map((a) => (a.id === draggingId ? { ...a, x: newX, y: newY } : a))
    );
  }

  function handlePointerUp() {
    setDraggingId(null);
  }

  // Keyboard navigation & delete
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        if (
          document.activeElement?.tagName === "INPUT" ||
          document.activeElement?.tagName === "TEXTAREA"
        ) {
          return;
        }
        setAnnotations((prev) => prev.filter((a) => a.id !== selectedId));
        setSelectedId(null);
      } else if (e.key === "Escape") {
        setSelectedId(null);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedId]);

  function updateAnnotationText(id: string, text: string) {
    setAnnotations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, text } : a))
    );
  }

  function updateAnnotationFontSize(id: string, delta: number) {
    setAnnotations((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const newSize = Math.max(8, Math.min(36, a.fontSize + delta));
        return { ...a, fontSize: newSize };
      })
    );
  }

  function deleteAnnotation(id: string) {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  // Export / Download PDF
  async function handleExport() {
    if (!file) return;
    setProcessing(true);
    setError(null);

    try {
      const bytes = await file.arrayBuffer();
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const helvetica = await doc.embedFont(StandardFonts.Helvetica);

      if (acroFields.length > 0) {
        try {
          const form = doc.getForm();
          for (const field of acroFields) {
            if (field.type === "text") {
              const tf = form.getTextField(field.name);
              tf.setText(String(field.value));
            } else if (field.type === "checkbox") {
              const cb = form.getCheckBox(field.name);
              if (field.value) {
                cb.check();
              } else {
                cb.uncheck();
              }
            }
          }
        } catch {
          // ignore form update failures on malformed fields
        }
      }

      for (const anno of annotations) {
        if (anno.page < 1 || anno.page > doc.getPageCount()) continue;
        const page = doc.getPage(anno.page - 1);
        const { width: pW, height: pH } = page.getSize();

        if (anno.type === "signature" && anno.sigDataUrl) {
          try {
            const pngBytes = await fetch(anno.sigDataUrl).then((res) => res.arrayBuffer());
            const pngImage = await doc.embedPng(pngBytes);
            const w = (anno.sigWidth || 0.22) * pW;
            const h = (anno.sigHeight || 0.08) * pH;
            const x = anno.x * pW;
            const y = pH - anno.y * pH - h;

            page.drawImage(pngImage, {
              x,
              y,
              width: w,
              height: h,
            });
          } catch {
            // skip if signature decode failed
          }
        } else {
          const x = anno.x * pW;
          const y = pH - anno.y * pH - anno.fontSize;

          page.drawText(anno.text, {
            x,
            y,
            size: anno.fontSize,
            font: helvetica,
            color: hexToRgb(anno.color),
          });
        }
      }

      const outputBytes = await doc.save();
      const blob = new Blob([outputBytes.buffer as ArrayBuffer], {
        type: "application/pdf",
      });

      const fallbackName = file.name.replace(/\.pdf$/i, "") + "-filled.pdf";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fallbackName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat mengunduh form");
    } finally {
      setProcessing(false);
    }
  }

  const selectedAnno = annotations.find((a) => a.id === selectedId);

  return (
    <ToolShell
      title={t("title")}
      description={t("description")}
      wide
    >
      <div className="w-full max-w-5xl mx-auto space-y-6">
        <ErrorBanner message={error} />

        {!file ? (
          <div className="glass-panel p-8 rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm">
            <PdfDropzone
              onFiles={(list) => {
                const f = list?.[0];
                if (f) handleFile(f);
              }}
              multiple={false}
              labels={{
                choose: "Pilih file PDF formulir",
                drop: "atau seret formulir PDF ke sini",
                hint: "PDF · Formulir pendaftaran, bank, lamaran kerja, atau dokumen resmi",
              }}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Top Action Toolbar */}
            <div className="glass-panel p-4 rounded-2xl border border-zinc-200/80 dark:border-white/10 shadow-sm flex flex-wrap items-center justify-between gap-4">
              {/* Tool Selection Group */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTool("text");
                    setSelectedId(null);
                  }}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                    activeTool === "text"
                      ? "bg-teal-600 text-white shadow"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200"
                  }`}
                >
                  <Type className="w-4 h-4" />
                  <span>Ketik Teks</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTool("check");
                    setSelectedId(null);
                  }}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                    activeTool === "check"
                      ? "bg-teal-600 text-white shadow"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200"
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>Centang (✓)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTool("cross");
                    setSelectedId(null);
                  }}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                    activeTool === "cross"
                      ? "bg-teal-600 text-white shadow"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200"
                  }`}
                >
                  <span>Silang (✕)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTool("date");
                    setSelectedId(null);
                  }}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                    activeTool === "date"
                      ? "bg-teal-600 text-white shadow"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200"
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Tanggal Hari Ini</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTool("signature");
                    setSelectedId(null);
                  }}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                    activeTool === "signature"
                      ? "bg-teal-600 text-white shadow"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200"
                  }`}
                >
                  <PenTool className="w-4 h-4" />
                  <span>Tanda Tangan</span>
                </button>
              </div>

              {/* AcroForm & Action buttons */}
              <div className="flex items-center gap-2">
                {acroFields.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAcroPanel(!showAcroPanel)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                      showAcroPanel
                        ? "bg-teal-600 text-white"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>Form Interaktif ({acroFields.length})</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleExport}
                  disabled={processing}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow transition cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{processing ? "Memproses..." : "Unduh PDF Selesai"}</span>
                </button>
              </div>
            </div>

            {/* Formatting Bar */}
            <div className="glass-panel px-4 py-2.5 rounded-xl border border-zinc-200/80 dark:border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-4">
                <span className="text-zinc-500 font-medium">Format:</span>

                {/* Font Size Picker */}
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-400">Ukuran:</span>
                  <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
                    <button
                      type="button"
                      onClick={() => {
                        const newSize = Math.max(8, selectedFontSize - 2);
                        setSelectedFontSize(newSize);
                        if (selectedId) updateAnnotationFontSize(selectedId, -2);
                      }}
                      className="p-1 hover:bg-white dark:hover:bg-zinc-700 rounded transition cursor-pointer"
                      title="Perkecil Ukuran"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-2 font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                      {selectedAnno ? selectedAnno.fontSize : selectedFontSize}pt
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const newSize = Math.min(36, selectedFontSize + 2);
                        setSelectedFontSize(newSize);
                        if (selectedId) updateAnnotationFontSize(selectedId, 2);
                      }}
                      className="p-1 hover:bg-white dark:hover:bg-zinc-700 rounded transition cursor-pointer"
                      title="Perbesar Ukuran"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Color Picker */}
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-400">Warna:</span>
                  <div className="flex items-center gap-1.5">
                    {FONT_COLORS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => {
                          setSelectedColor(c.value);
                          if (selectedId) {
                            setAnnotations((prev) =>
                              prev.map((a) => (a.id === selectedId ? { ...a, color: c.value } : a))
                            );
                          }
                        }}
                        className={`w-5 h-5 rounded-full border-2 transition cursor-pointer ${
                          selectedColor === c.value
                            ? "border-teal-500 scale-110 shadow-sm"
                            : "border-transparent opacity-80 hover:opacity-100"
                        }`}
                        style={{ backgroundColor: c.value }}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Zoom & Page Navigation */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.max(0.75, z - 0.25))}
                    disabled={zoom <= 0.75}
                    className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-600 dark:text-zinc-300 disabled:opacity-40 cursor-pointer"
                    title="Perkecil Tampilan"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="font-mono text-zinc-500 w-12 text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.min(1.75, z + 0.25))}
                    disabled={zoom >= 1.75}
                    className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-600 dark:text-zinc-300 disabled:opacity-40 cursor-pointer"
                    title="Perbesar Tampilan"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>

                <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700" />

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="p-1 h-7 w-7 flex items-center justify-center rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    Hal {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="p-1 h-7 w-7 flex items-center justify-center rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Instruction Banner */}
            <div className="bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/40 rounded-xl px-4 py-2.5 text-xs text-teal-800 dark:text-teal-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 shrink-0 text-teal-600 dark:text-teal-400" />
                <span>
                  <strong>Petunjuk:</strong> Klik di mana saja pada lembar formulir untuk menempelkan teks atau centang. Anda bisa menggeser posisi atau mengubah ukuran teks kapan saja.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setAnnotations([]);
                }}
                className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 underline cursor-pointer"
              >
                Ganti File
              </button>
            </div>

            {/* Main Interactive Workspace */}
            <div className="flex gap-6 items-start">
              {/* Document Canvas Area */}
              <div className="flex-1 overflow-auto max-h-[820px] p-4 bg-zinc-200/50 dark:bg-zinc-950/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex justify-center">
                <div
                  ref={containerRef}
                  onClick={handleContainerClick}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  className="relative bg-white shadow-2xl rounded-sm select-none cursor-crosshair"
                >
                  <canvas ref={canvasRef} className="block pointer-events-none" />

                  {/* Render Placed Annotations on Current Page */}
                  {annotations
                    .filter((a) => a.page === currentPage)
                    .map((anno) => {
                      const isSelected = selectedId === anno.id;

                      if (anno.type === "signature" && anno.sigDataUrl) {
                        return (
                          <div
                            key={anno.id}
                            data-annotation-id={anno.id}
                            onPointerDown={(e) => handlePointerDown(e, anno.id)}
                            style={{
                              left: `${anno.x * 100}%`,
                              top: `${anno.y * 100}%`,
                              width: `${(anno.sigWidth || 0.22) * 100}%`,
                            }}
                            className={`absolute cursor-move group select-none transition-shadow ${
                              isSelected
                                ? "ring-2 ring-teal-500 ring-offset-2 ring-offset-white shadow-lg bg-teal-50/20"
                                : "hover:ring-1 hover:ring-zinc-400"
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={anno.sigDataUrl}
                              alt="Signature"
                              className="w-full h-auto pointer-events-none"
                            />
                            {isSelected && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteAnnotation(anno.id);
                                }}
                                className="absolute -top-3 -right-3 p-1 bg-red-500 text-white rounded-full shadow hover:bg-red-600 transition cursor-pointer"
                                title="Hapus Tanda Tangan"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        );
                      }

                      return (
                        <div
                          key={anno.id}
                          data-annotation-id={anno.id}
                          onPointerDown={(e) => handlePointerDown(e, anno.id)}
                          style={{
                            left: `${anno.x * 100}%`,
                            top: `${anno.y * 100}%`,
                            color: anno.color,
                            fontSize: `${anno.fontSize * zoom}px`,
                            lineHeight: 1.1,
                          }}
                          className={`absolute cursor-move group select-none p-1 rounded transition-shadow ${
                            isSelected
                              ? "ring-2 ring-teal-500 ring-offset-1 ring-offset-white shadow-md bg-teal-50/40 dark:bg-teal-900/40"
                              : "hover:ring-1 hover:ring-zinc-400/80"
                          }`}
                        >
                          {isSelected ? (
                            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="text"
                                value={anno.text}
                                onChange={(e) => updateAnnotationText(anno.id, e.target.value)}
                                autoFocus
                                className="bg-transparent border-b border-teal-500 focus:outline-none px-0.5 py-0 min-w-[60px]"
                                style={{
                                  color: anno.color,
                                  fontSize: `${anno.fontSize * zoom}px`,
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => deleteAnnotation(anno.id)}
                                className="p-0.5 text-red-500 hover:text-red-700 transition cursor-pointer"
                                title="Hapus"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="font-medium whitespace-pre">{anno.text}</span>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Sidebar AcroForm Interactive Fields Panel */}
              {showAcroPanel && acroFields.length > 0 && (
                <div className="w-80 glass-panel p-4 rounded-2xl border border-zinc-200/80 dark:border-white/10 shadow-sm space-y-4 max-h-[820px] overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                        Formulir Interaktif
                      </h4>
                      <p className="text-xs text-zinc-500">
                        {acroFields.length} field terdeteksi dari PDF
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    {acroFields.map((field, idx) => (
                      <div key={idx} className="space-y-1">
                        <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block truncate">
                          {field.name}
                        </label>

                        {field.type === "checkbox" ? (
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(field.value)}
                              onChange={(e) => {
                                const next = [...acroFields];
                                next[idx].value = e.target.checked;
                                setAcroFields(next);
                              }}
                              className="rounded text-teal-600 focus:ring-teal-500"
                            />
                            <span className="text-xs text-zinc-600 dark:text-zinc-400">
                              Centang opsi ini
                            </span>
                          </label>
                        ) : (
                          <input
                            type="text"
                            value={String(field.value)}
                            onChange={(e) => {
                              const next = [...acroFields];
                              next[idx].value = e.target.value;
                              setAcroFields(next);
                            }}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                            placeholder="Isi jawaban..."
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Signature Creation Modal */}
      <CreateSignatureModal
        open={sigModalOpen}
        onClose={() => {
          setSigModalOpen(false);
          setPendingSigPos(null);
        }}
        onCreate={onSignatureCreated}
        labels={{
          title: tSign("modalTitle"),
          draw: tSign("methodDraw"),
          type: tSign("methodType"),
          upload: tSign("methodUpload"),
          drawHere: tSign("drawHint"),
          typePlaceholder: tSign("typePlaceholder"),
          uploadHint: tSign("uploadHintSig"),
          clear: tSign("clearDraw"),
          cancel: tSign("cancel"),
          create: tSign("create"),
        }}
      />
    </ToolShell>
  );
}
