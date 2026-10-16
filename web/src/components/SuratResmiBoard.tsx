"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ToolShell } from "@/components/ToolShell";
import { ErrorBanner } from "@/components/ErrorBanner";
import { Button } from "@/components/ui/Button";
import { generateSuratResmiPdf } from "@/lib/documentGenerators";
import { ScrollText, Download } from "lucide-react";

export function SuratResmiBoard() {
  const t = useTranslations("suratResmi");
  const tCommon = useTranslations("common");

  const [instansi, setInstansi] = useState("PT NUSANTARA KARYA BERSAMA");
  const [alamatInstansi, setAlamatInstansi] = useState("Gedung Graha Mandiri Lt. 8, Jl. M.H. Thamrin No. 20, Jakarta Pusat");
  const [kontakInstansi, setKontakInstansi] = useState("Telepon: (021) 3983-0000 | Email: sekretariat@nusantarakarya.co.id");

  const [tanggalKota, setTanggalKota] = useState("Jakarta, 13 Oktober 2026");
  const [nomorSurat, setNomorSurat] = useState("042/DIR-NKB/X/2026");
  const [lampiran, setLampiran] = useState("1 (satu) Berkas");
  const [perihal, setPerihal] = useState("Pemberitahuan Kerjasama & Undangan Rapat Koordinasi");

  const [kepada, setKepada] = useState("Pimpinan Rekanan / Mitra Kerja");
  const [tujuanAlamat, setTujuanAlamat] = useState("Di Tempat");

  const [salamPembuka, setSalamPembuka] = useState("Dengan hormat,");
  const [paragrafPembuka, setParagrafPembuka] = useState("Sehubungan dengan pelaksanaan agenda penguatan teknologi informasi kuartal IV tahun 2026, bersama ini kami menyampaikan rencana kemitraan strategis antar lembaga.");
  const [paragrafIsi, setParagrafIsi] = useState("Kami mengundang Bapak/Ibu untuk hadir pada sesi presentasi dan koordinasi teknis yang akan diselenggarakan secara luring pada hari Senin, 19 Oktober 2026 pukul 09.00 WIB bertempat di Ruang Rapat Utama Nusantara.");
  const [paragrafPenutup, setParagrafPenutup] = useState("Demikian surat pemberitahuan ini kami sampaikan. Atas perhatian, kesediaan, dan kerja sama yang baik, kami ucapkan terima kasih.");

  const [penandatanganJabatan, setPenandatanganJabatan] = useState("Direktur Utama,");
  const [penandatanganNama, setPenandatanganNama] = useState("Bagus Lucky, M.Kom.");

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setProcessing(true);
    setError(null);

    try {
      const blob = await generateSuratResmiPdf({
        instansi,
        alamatInstansi,
        kontakInstansi,
        tanggalKota,
        nomorSurat,
        lampiran,
        perihal,
        kepada,
        tujuanAlamat,
        salamPembuka,
        paragrafPembuka,
        paragrafIsi,
        paragrafPenutup,
        penandatanganJabatan,
        penandatanganNama,
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Surat-Resmi-${nomorSurat.replace(/[/\\?%*:|"<>]/g, "-")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat surat resmi PDF");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <ToolShell title={t("title")} description={t("description")} wide>
      <div className="space-y-6">
        {/* Kop Surat Section */}
        <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-white/10 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 block">
            Kop Surat Instansi / Perusahaan
          </span>
          <input
            type="text"
            value={instansi}
            onChange={(e) => setInstansi(e.target.value)}
            placeholder="Nama Perusahaan / Instansi (KAPITAL)"
            className="w-full rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-bold"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              value={alamatInstansi}
              onChange={(e) => setAlamatInstansi(e.target.value)}
              placeholder="Alamat Kantor Instansi"
              className="w-full rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs"
            />
            <input
              type="text"
              value={kontakInstansi}
              onChange={(e) => setKontakInstansi(e.target.value)}
              placeholder="No. Telepon / Website / Email"
              className="w-full rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs"
            />
          </div>
        </div>

        {/* Info Surat Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-white/10 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 block">
              Detail Surat & Identitas
            </span>
            <div>
              <span className="text-[11px] text-zinc-500">Nomor Surat</span>
              <input
                type="text"
                value={nomorSurat}
                onChange={(e) => setNomorSurat(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-semibold mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[11px] text-zinc-500">Lampiran</span>
                <input
                  type="text"
                  value={lampiran}
                  onChange={(e) => setLampiran(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs mt-1"
                />
              </div>
              <div>
                <span className="text-[11px] text-zinc-500">Tanggal & Kota</span>
                <input
                  type="text"
                  value={tanggalKota}
                  onChange={(e) => setTanggalKota(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs mt-1"
                />
              </div>
            </div>
            <div>
              <span className="text-[11px] text-zinc-500">Perihal</span>
              <input
                type="text"
                value={perihal}
                onChange={(e) => setPerihal(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-bold mt-1"
              />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-white/10 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 block">
              Penerima Surat (Tujuan)
            </span>
            <div>
              <span className="text-[11px] text-zinc-500">Kepada Yth.</span>
              <input
                type="text"
                value={kepada}
                onChange={(e) => setKepada(e.target.value)}
                placeholder="Nama Penerima / Jabatan"
                className="w-full rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-semibold mt-1"
              />
            </div>
            <div>
              <span className="text-[11px] text-zinc-500">Alamat / Lokasi Tujuan</span>
              <input
                type="text"
                value={tujuanAlamat}
                onChange={(e) => setTujuanAlamat(e.target.value)}
                placeholder="Di Tempat / Kota"
                className="w-full rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs mt-1"
              />
            </div>
          </div>
        </div>

        {/* Body Paragraphs */}
        <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-white/10 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 block">
            Isi Surat
          </span>
          <div>
            <span className="text-[11px] text-zinc-500">Salam Pembuka</span>
            <input
              type="text"
              value={salamPembuka}
              onChange={(e) => setSalamPembuka(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs mt-1"
            />
          </div>
          <div>
            <span className="text-[11px] text-zinc-500">Paragraf Pembuka</span>
            <textarea
              rows={2}
              value={paragrafPembuka}
              onChange={(e) => setParagrafPembuka(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 p-3 text-xs mt-1"
            />
          </div>
          <div>
            <span className="text-[11px] text-zinc-500">Paragraf Inti / Pokok Surat</span>
            <textarea
              rows={3}
              value={paragrafIsi}
              onChange={(e) => setParagrafIsi(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 p-3 text-xs mt-1"
            />
          </div>
          <div>
            <span className="text-[11px] text-zinc-500">Paragraf Penutup</span>
            <textarea
              rows={2}
              value={paragrafPenutup}
              onChange={(e) => setParagrafPenutup(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 p-3 text-xs mt-1"
            />
          </div>
        </div>

        {/* Penandatangan */}
        <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-white/10 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 block">
            Penandatangan Surat
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-[11px] text-zinc-500">Jabatan Penandatangan</span>
              <input
                type="text"
                value={penandatanganJabatan}
                onChange={(e) => setPenandatanganJabatan(e.target.value)}
                placeholder="Contoh: Direktur Utama,"
                className="w-full rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs mt-1"
              />
            </div>
            <div>
              <span className="text-[11px] text-zinc-500">Nama Lengkap & Gelar</span>
              <input
                type="text"
                value={penandatanganNama}
                onChange={(e) => setPenandatanganNama(e.target.value)}
                placeholder="Contoh: Bagus Lucky, M.Kom."
                className="w-full rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-bold mt-1"
              />
            </div>
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
          <span>Buat & Unduh Surat Resmi PDF</span>
        </Button>
      </div>
    </ToolShell>
  );
}
