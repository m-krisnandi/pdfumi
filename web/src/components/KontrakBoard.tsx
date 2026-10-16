"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ToolShell } from "@/components/ToolShell";
import { ErrorBanner } from "@/components/ErrorBanner";
import { Button } from "@/components/ui/Button";
import { generateKontrakPdf } from "@/lib/documentGenerators";
import { Plus, Trash2, Download, FileCheck } from "lucide-react";

export function KontrakBoard() {
  const t = useTranslations("kontrak");
  const tCommon = useTranslations("common");

  const [judul, setJudul] = useState("SURAT PERJANJIAN KERJA SAMA (SPK)");
  const [nomorKontrak, setNomorKontrak] = useState("012/SPK/X/2026");
  const [tanggalTempat, setTanggalTempat] = useState("Jakarta, pada hari Selasa tanggal 13 Oktober 2026");

  // Pihak 1
  const [pihak1Nama, setPihak1Nama] = useState("Bagus Lucky");
  const [pihak1Jabatan, setPihak1Jabatan] = useState("Direktur Operasional");
  const [pihak1Instansi, setPihak1Instansi] = useState("PT Teknologi Solusi Nusantara");
  const [pihak1Alamat, setPihak1Alamat] = useState("Jl. Sudirman Kav. 28, Jakarta Pusat");

  // Pihak 2
  const [pihak2Nama, setPihak2Nama] = useState("Hendra Saputra");
  const [pihak2Jabatan, setPihak2Jabatan] = useState("Project Manager");
  const [pihak2Instansi, setPihak2Instansi] = useState("CV Mitra Cipta Digital");
  const [pihak2Alamat, setPihak2Alamat] = useState("Jl. Gatot Subroto No. 88, Jakarta Selatan");

  // Pasal-pasal
  const [pasalList, setPasalList] = useState<{ judul: string; isi: string }[]>([
    {
      judul: "Ruang Lingkup Pekerjaan",
      isi: "PIHAK KEDUA sepakat untuk melaksanakan pekerjaan implementasi dan integrasi modul sistem informasi dokumen sesuai spesifikasi teknis yang disetujui bersama oleh PIHAK PERTAMA.",
    },
    {
      judul: "Jangka Waktu dan Penyerahan",
      isi: "Pekerjaan ini dilaksanakan dalam jangka waktu 60 (enam puluh) hari kalender terhitung sejak penandatanganan perjanjian ini sampai dengan Berita Acara Serah Terima (BAST).",
    },
    {
      judul: "Nilai Kontrak dan Ketentuan Pembayaran",
      isi: "Nilai imbalan kerja sama ini disepakati sebesar Rp50.000.000,- (lima puluh juta rupiah), dibayarkan secara bertahap dalam 2 (dua) termin transfer bank setelah verifikasi pekerjaan.",
    },
    {
      judul: "Penyelesaian Perselisihan",
      isi: "Segala perselisihan yang timbul dari pelaksanaan perjanjian ini akan diselesaikan secara musyawarah untuk mufakat. Apabila tidak tercapai mufakat, para pihak sepakat memilih domisili hukum di Pengadilan Negeri Jakarta Pusat.",
    },
  ]);

  const [penutup, setPenutup] = useState("Demikian surat perjanjian ini dibuat dalam 2 (dua) rangkap bermaterai cukup dan masing-masing memiliki kekuatan hukum yang sama bagi kedua belah pihak.");

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addPasal() {
    setPasalList((prev) => [...prev, { judul: "Klausul Tambahan", isi: "" }]);
  }

  function removePasal(index: number) {
    setPasalList((prev) => prev.filter((_, i) => i !== index));
  }

  function updatePasal(index: number, field: "judul" | "isi", val: string) {
    setPasalList((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  }

  async function handleDownload() {
    setProcessing(true);
    setError(null);

    try {
      const blob = await generateKontrakPdf({
        judul,
        nomorKontrak,
        tanggalTempat,
        pihak1Nama,
        pihak1Jabatan,
        pihak1Instansi,
        pihak1Alamat,
        pihak2Nama,
        pihak2Jabatan,
        pihak2Instansi,
        pihak2Alamat,
        pasalList,
        penutup,
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Kontrak-${nomorKontrak.replace(/[/\\?%*:|"<>]/g, "-")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat PDF kontrak perjanjian");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <ToolShell title={t("title")} description={t("description")} wide>
      <div className="space-y-6">
        {/* Top Info */}
        <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-white/10 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 block">
            Judul & Legalitas Dokumen
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <span className="text-[11px] text-zinc-500">Judul Kontrak / Perjanjian</span>
              <input
                type="text"
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-bold mt-1"
              />
            </div>
            <div>
              <span className="text-[11px] text-zinc-500">Nomor Dokumen</span>
              <input
                type="text"
                value={nomorKontrak}
                onChange={(e) => setNomorKontrak(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-semibold mt-1"
              />
            </div>
          </div>
          <div>
            <span className="text-[11px] text-zinc-500">Hari, Tanggal & Tempat Pembuatan</span>
            <input
              type="text"
              value={tanggalTempat}
              onChange={(e) => setTanggalTempat(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs mt-1"
            />
          </div>
        </div>

        {/* Pihak 1 & Pihak 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-white/10 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 block">
              1. PIHAK PERTAMA
            </span>
            <input
              type="text"
              value={pihak1Nama}
              onChange={(e) => setPihak1Nama(e.target.value)}
              placeholder="Nama Lengkap"
              className="w-full rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-bold"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={pihak1Jabatan}
                onChange={(e) => setPihak1Jabatan(e.target.value)}
                placeholder="Jabatan"
                className="w-full rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs"
              />
              <input
                type="text"
                value={pihak1Instansi}
                onChange={(e) => setPihak1Instansi(e.target.value)}
                placeholder="Perusahaan / Instansi"
                className="w-full rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs"
              />
            </div>
            <input
              type="text"
              value={pihak1Alamat}
              onChange={(e) => setPihak1Alamat(e.target.value)}
              placeholder="Alamat Lengkap Domisili"
              className="w-full rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs"
            />
          </div>

          <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-white/10 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 block">
              2. PIHAK KEDUA
            </span>
            <input
              type="text"
              value={pihak2Nama}
              onChange={(e) => setPihak2Nama(e.target.value)}
              placeholder="Nama Lengkap"
              className="w-full rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-bold"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={pihak2Jabatan}
                onChange={(e) => setPihak2Jabatan(e.target.value)}
                placeholder="Jabatan"
                className="w-full rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs"
              />
              <input
                type="text"
                value={pihak2Instansi}
                onChange={(e) => setPihak2Instansi(e.target.value)}
                placeholder="Perusahaan / Instansi"
                className="w-full rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs"
              />
            </div>
            <input
              type="text"
              value={pihak2Alamat}
              onChange={(e) => setPihak2Alamat(e.target.value)}
              placeholder="Alamat Lengkap Domisili"
              className="w-full rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs"
            />
          </div>
        </div>

        {/* Dynamic Pasal-pasal */}
        <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              Pasal-Pasal Perjanjian ({pasalList.length})
            </span>
            <button
              type="button"
              onClick={addPasal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Pasal</span>
            </button>
          </div>

          <div className="space-y-4">
            {pasalList.map((pasal, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900 dark:text-white">
                    Pasal {idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removePasal(idx)}
                    className="p-1 text-zinc-400 hover:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <input
                  type="text"
                  value={pasal.judul}
                  onChange={(e) => updatePasal(idx, "judul", e.target.value)}
                  placeholder="Judul Pasal (Contoh: Hak dan Kewajiban)"
                  className="w-full rounded-lg border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-semibold"
                />
                <textarea
                  rows={2}
                  value={pasal.isi}
                  onChange={(e) => updatePasal(idx, "isi", e.target.value)}
                  placeholder="Bunyi pasal ketentuan..."
                  className="w-full rounded-lg border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-900 p-3 text-xs"
                />
              </div>
            ))}
          </div>
        </div>

        <ErrorBanner message={error} />

        <Button
          type="button"
          loading={processing}
          onClick={handleDownload}
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          <span>Buat & Unduh Kontrak Perjanjian PDF</span>
        </Button>
      </div>
    </ToolShell>
  );
}
