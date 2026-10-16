"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

export type SignatureColor = "#1a1a1a" | "#1e3a8a" | "#b91c1c";

type Tab = "draw" | "type" | "upload";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (dataUrl: string) => void;
  labels: {
    title: string;
    draw: string;
    type: string;
    upload: string;
    drawHere: string;
    typePlaceholder: string;
    uploadHint: string;
    clear: string;
    cancel: string;
    create: string;
  };
};

const COLORS: SignatureColor[] = ["#1a1a1a", "#1e3a8a", "#b91c1c"];

export function CreateSignatureModal({ open, onClose, onCreate, labels }: Props) {
  const [tab, setTab] = useState<Tab>("draw");
  const [color, setColor] = useState<SignatureColor>("#1a1a1a");
  const [typed, setTyped] = useState("");
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [hasInk, setHasInk] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const hasInkRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    setTab("draw");
    setColor("#1a1a1a");
    setTyped("");
    setUploadPreview(null);
    setHasInk(false);
    hasInkRef.current = false;
  }, [open]);

  useEffect(() => {
    if (!open || tab !== "draw") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = canvas.clientWidth || 480;
    const cssH = canvas.clientHeight || 180;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = color;
    hasInkRef.current = false;
    setHasInk(false);
  }, [open, tab, color]);

  if (!open) return null;

  function point(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = point(e);
    ctx.strokeStyle = color;
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current || !last.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const p = point(e);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    if (!hasInkRef.current) {
      hasInkRef.current = true;
      setHasInk(true);
    }
  }

  function onPointerUp() {
    drawing.current = false;
    last.current = null;
  }

  function clearDraw() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    hasInkRef.current = false;
    setHasInk(false);
  }

  function onUpload(file: File | null) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setUploadPreview(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function renderTypedDataUrl(): string | null {
    const text = typed.trim();
    if (!text) return null;
    const canvas = document.createElement("canvas");
    const w = Math.min(720, Math.max(280, text.length * 42));
    const h = 140;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `italic 64px "Segoe Script", "Apple Chancery", "Bradley Hand", "Comic Sans MS", cursive`;
    // shrink if needed
    let size = 64;
    while (size > 28 && ctx.measureText(text).width > w - 24) {
      size -= 2;
      ctx.font = `italic ${size}px "Segoe Script", "Apple Chancery", "Bradley Hand", "Comic Sans MS", cursive`;
    }
    ctx.fillText(text, w / 2, h / 2 + 4);
    return canvas.toDataURL("image/png");
  }

  function canCreate() {
    if (tab === "draw") return hasInk;
    if (tab === "type") return typed.trim().length > 0;
    return Boolean(uploadPreview);
  }

  function handleCreate() {
    if (tab === "draw") {
      const canvas = canvasRef.current;
      if (!canvas || !hasInk) return;
      onCreate(canvas.toDataURL("image/png"));
      return;
    }
    if (tab === "type") {
      const url = renderTypedDataUrl();
      if (!url) return;
      onCreate(url);
      return;
    }
    if (uploadPreview) onCreate(uploadPreview);
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "draw", label: labels.draw },
    { id: "type", label: labels.type },
    { id: "upload", label: labels.upload },
  ];

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={labels.title}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-3xl glass-panel shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-200/60 dark:border-white/10 px-6 py-4">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {labels.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            aria-label={labels.cancel}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1.5 border-b border-zinc-200/60 dark:border-white/10 glass-segmented p-2">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                tab === item.id
                  ? "bg-white dark:bg-white/15 text-teal-700 dark:text-teal-300 shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="space-y-4 p-6">
          {(tab === "draw" || tab === "type") && (
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mr-1">Warna:</span>
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all cursor-pointer ${
                    color === c ? "ring-2 ring-teal-500 ring-offset-2 dark:ring-offset-zinc-900 scale-105" : "hover:scale-105"
                  }`}
                  aria-label={c}
                >
                  <span className="h-5 w-5 rounded-full shadow-sm" style={{ background: c }} />
                </button>
              ))}
            </div>
          )}

          {tab === "draw" ? (
            <div className="space-y-2">
              <div className="relative overflow-hidden rounded-2xl border border-zinc-200/60 dark:border-white/10 bg-white dark:bg-zinc-900/70 shadow-inner">
                <canvas
                  ref={canvasRef}
                  className="h-44 w-full touch-none cursor-crosshair"
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                />
                <div className="pointer-events-none absolute inset-x-8 bottom-10 border-t border-teal-500/25" />
                {!hasInk ? (
                  <p className="pointer-events-none absolute inset-0 flex items-end justify-center pb-4 text-xs font-medium text-teal-600/60 dark:text-teal-400/60">
                    {labels.drawHere}
                  </p>
                ) : null}
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={clearDraw}
                  disabled={!hasInk}
                  className="text-xs font-semibold text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 underline disabled:opacity-40 cursor-pointer"
                >
                  {labels.clear}
                </button>
              </div>
            </div>
          ) : null}

          {tab === "type" ? (
            <div className="space-y-3">
              <input
                type="text"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder={labels.typePlaceholder}
                className="glass-input w-full rounded-2xl px-4 py-3 text-sm font-medium"
                maxLength={48}
                autoFocus
              />
              <div
                className="flex h-28 items-center justify-center rounded-2xl border border-dashed border-zinc-200/60 dark:border-white/10 bg-white dark:bg-zinc-900/70 px-4 shadow-inner"
                style={{ color }}
              >
                <span
                  className="truncate text-center text-3xl italic"
                  style={{
                    fontFamily:
                      '"Segoe Script", "Apple Chancery", "Bradley Hand", "Comic Sans MS", cursive',
                  }}
                >
                  {typed.trim() || labels.typePlaceholder}
                </span>
              </div>
            </div>
          ) : null}

          {tab === "upload" ? (
            <div className="space-y-3">
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-200/80 dark:border-white/15 bg-zinc-50/50 dark:bg-zinc-900/50 px-4 py-10 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 hover:border-teal-500 transition-colors">
                <span>{labels.uploadHint}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                  className="sr-only"
                  onChange={(e) => onUpload(e.target.files?.[0] ?? null)}
                />
              </label>
              {uploadPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={uploadPreview}
                  alt=""
                  className="mx-auto max-h-28 object-contain rounded-lg p-2 bg-white/80"
                />
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex justify-end gap-2.5 border-t border-zinc-200/60 dark:border-white/10 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="glass-pill px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer"
          >
            {labels.cancel}
          </button>
          <button
            type="button"
            disabled={!canCreate()}
            onClick={handleCreate}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 dark:bg-teal-500 dark:hover:bg-teal-400 dark:text-zinc-950 shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-40 cursor-pointer"
          >
            {labels.create}
          </button>
        </div>
      </div>
    </div>
  );
}
