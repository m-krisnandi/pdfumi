"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

type Props = {
  value?: string;
  onChange: (dataUrl: string | undefined) => void;
  /** Optional override; defaults to certificate.drawHint / clearSignature */
  labels?: {
    hint: string;
    clear: string;
  };
};

/**
 * Draw-to-sign pad. Emits a PNG data URL when the user finishes a stroke.
 */
export function SignaturePad({ value, onChange, labels }: Props) {
  const t = useTranslations("certificate");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(Boolean(value));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1a1f1c";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);
    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasInk(true);
      };
      img.src = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- size once on mount; value is initial only
  }, []);

  function point(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    drawing.current = true;
    const p = point(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const p = point(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    setHasInk(true);
  }

  function end() {
    if (!drawing.current) return;
    drawing.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    onChange(canvas.toDataURL("image/png"));
    setHasInk(true);
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);
    setHasInk(false);
    onChange(undefined);
  }

  const hint = labels?.hint ?? t("drawHint");
  const clearLabel = labels?.clear ?? t("clearSignature");

  return (
    <div className="space-y-2">
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="h-28 w-full touch-none rounded-lg border border-[color:var(--line)] bg-white"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
        />
        {!hasInk ? (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center px-3 text-center text-[11px] text-[color:var(--ink)]/40 sm:hidden">
            {hint}
          </p>
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="hidden text-[11px] text-[color:var(--ink)]/45 sm:block">{hint}</p>
        <button
          type="button"
          onClick={clear}
          className="cursor-pointer text-xs text-[color:var(--accent)] hover:underline"
        >
          {clearLabel}
        </button>
      </div>
    </div>
  );
}
