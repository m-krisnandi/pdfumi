"use client";

import { useState } from "react";
import { apiFetch, toApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ErrorBanner";
import {
  Bug,
  Lightbulb,
  MessageSquare,
  Send,
  CheckCircle2,
  Mail,
  FileText,
  Sparkles,
} from "lucide-react";

type CategoryType = "BUG" | "FEATURE" | "FEEDBACK";

export function FeedbackBoard() {
  const [category, setCategory] = useState<CategoryType>("BUG");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setError("Silakan isi judul dan deskripsi laporan Anda.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch("/api/v1/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          subject: subject.trim(),
          description: description.trim(),
          email: email.trim() || null,
        }),
      });

      if (!res.ok) {
        throw await toApiError(res);
      }

      setIsSuccess(true);
      setSubject("");
      setDescription("");
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirimkan laporan. Silakan coba kembali.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
      <div className="glass-panel rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden border border-zinc-200/60 dark:border-white/10">
        {/* Header */}
        <div className="text-center max-w-lg mx-auto mb-8 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-pill text-teal-600 dark:text-teal-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pusat Masukan & Bantuan Komunitas</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            Feedback & Laporkan Masalah
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Menemukan kendala teknis atau memiliki ide fitur baru? Sampaikan langsung kepada tim pengembang Pdfumi. Setiap laporan akan ditinjau dan ditindaklanjuti.
          </p>
        </div>

        {isSuccess ? (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                Laporan Berhasil Terkirim
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
                Terima kasih atas kontribusi Anda dalam meningkatkan kualitas Pdfumi. Tim kami akan segera meninjau dan mengirimkan konfirmasi/balasan ke email Anda apabila disertakan.
              </p>
            </div>
            <div className="pt-4">
              <button
                onClick={() => setIsSuccess(false)}
                className="glass-pill px-5 py-2.5 rounded-xl text-xs font-bold text-zinc-800 dark:text-zinc-200 hover:scale-105 active:scale-95 transition-all"
              >
                Kirim Laporan Lainnya
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <ErrorBanner message={error} />}

            {/* Category Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Kategori Laporan
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setCategory("BUG")}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-bold transition-all ${
                    category === "BUG"
                      ? "bg-rose-500/10 border-rose-500/40 text-rose-700 dark:text-rose-400 shadow-sm"
                      : "border-zinc-200/70 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  <Bug className="w-4 h-4 text-rose-500" />
                  <span>Laporkan Bug</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCategory("FEATURE")}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-bold transition-all ${
                    category === "FEATURE"
                      ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-700 dark:text-indigo-400 shadow-sm"
                      : "border-zinc-200/70 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  <Lightbulb className="w-4 h-4 text-indigo-500" />
                  <span>Usulan Fitur</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCategory("FEEDBACK")}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-bold transition-all ${
                    category === "FEEDBACK"
                      ? "bg-teal-500/10 border-teal-500/40 text-teal-700 dark:text-teal-400 shadow-sm"
                      : "border-zinc-200/70 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-teal-500" />
                  <span>Saran Umum</span>
                </button>
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Judul / Topik Singkat <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={
                    category === "BUG"
                      ? "Contoh: Gagal split file PDF lebih dari 80 halaman"
                      : category === "FEATURE"
                      ? "Contoh: Dukungan ekspor laporan kwitansi ke Excel"
                      : "Contoh: Tampilan antarmuka di layar ponsel terasa terlalu padat"
                  }
                  className="glass-input w-full px-4 py-2.5 rounded-xl text-sm"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Deskripsi Lengkap <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder={
                  category === "BUG"
                    ? "Jelaskan langkah-langkah kejadian, pesan error yang muncul, atau format file yang dicoba..."
                    : "Jelaskan kebutuhan Anda secara rinci agar dapat kami pelajari implementasinya..."
                }
                className="glass-input w-full p-4 rounded-xl text-sm resize-y leading-relaxed"
                required
              />
            </div>

            {/* Email (Optional) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Email Anda (Opsional namun disarankan)
                </label>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Untuk menerima balasan</span>
              </div>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-zinc-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                />
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Email Anda hanya digunakan untuk pemberitahuan status tindak lanjut laporan ini dan tidak akan disebarluaskan.
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-sm bg-teal-600 hover:bg-teal-500 text-white dark:bg-teal-500 dark:hover:bg-teal-400 dark:text-zinc-950 shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                {loading ? (
                  <span>Mengirimkan laporan...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Kirimkan Masukan</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
