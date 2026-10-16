"use client";

import { useState } from "react";
import { Copy, Check, Share2, MessageCircle, Mail, X } from "lucide-react";

export function RequestSignatureModal({
  open,
  onClose,
  documentName,
}: {
  open: boolean;
  onClose: () => void;
  documentName: string;
}) {
  const [signerName, setSignerName] = useState("");
  const [signerContact, setSignerContact] = useState("");
  const [message, setMessage] = useState(
    "Halo, mohon luangkan waktu sebentar untuk menandatangani dokumen ini. Terima kasih!"
  );
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const currentUrl = typeof window !== "undefined" ? window.location.href : "https://pdfumi.com/tools/sign-pdf";
  const shareText = `Halo ${signerName || "Rekan"},\n\nAnda diminta untuk menandatangani dokumen "${documentName}".\n\nPesan: ${message}\n\nSilakan buka tautan berikut untuk menandatangani secara instan:\n${currentUrl}`;

  function handleCopy() {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleWhatsApp() {
    const cleanNumber = signerContact.replace(/[^0-9]/g, "");
    const waUrl = cleanNumber
      ? `https://wa.me/${cleanNumber}?text=${encodeURIComponent(shareText)}`
      : `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, "_blank");
  }

  function handleEmail() {
    const subject = encodeURIComponent(`Permintaan Tanda Tangan: ${documentName}`);
    const body = encodeURIComponent(shareText);
    window.location.href = `mailto:${signerContact}?subject=${subject}&body=${body}`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl glass-panel p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-zinc-200/60 dark:border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <h3 className="font-bold text-lg text-zinc-900 dark:text-white">
              Minta Tanda Tangan dari Orang Lain
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Nama Penandatangan
            </label>
            <input
              type="text"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder="Contoh: Bpk. Bambang Wijaya"
              className="mt-1 w-full rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Email atau Nomor WhatsApp
            </label>
            <input
              type="text"
              value={signerContact}
              onChange={(e) => setSignerContact(e.target.value)}
              placeholder="Contoh: 08123456789 atau nama@email.com"
              className="mt-1 w-full rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Pesan Tambahan
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 p-3 text-xs"
            />
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/10 text-xs text-zinc-500 space-y-1">
          <p className="font-semibold text-zinc-700 dark:text-zinc-300">Pratinjau Undangan:</p>
          <p className="line-clamp-3 italic">{shareText}</p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleWhatsApp}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Kirim WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={handleEmail}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              <span>Kirim Email</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 hover:border-teal-500 text-zinc-800 dark:text-zinc-200 text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? "Tersalin!" : "Salin Pesan & Link"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
