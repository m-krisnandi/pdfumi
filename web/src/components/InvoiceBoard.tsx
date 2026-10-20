"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ToolShell } from "@/components/ToolShell";
import { ErrorBanner } from "@/components/ErrorBanner";
import { Button } from "@/components/ui/Button";
import { generateInvoicePdf, type InvoiceItem } from "@/lib/documentGenerators";
import { Plus, Trash2, Download, Receipt, Eye, Sparkles } from "lucide-react";

export function InvoiceBoard() {
  const t = useTranslations("invoice");
  const tCommon = useTranslations("common");

  const [invoiceNumber, setInvoiceNumber] = useState("INV-2026-001");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  });
  const [currency, setCurrency] = useState("$");

  // Seller info
  const [sellerName, setSellerName] = useState("Studio Desain Mandiri");
  const [sellerAddress, setSellerAddress] = useState("Jl. Sudirman No. 45, Jakarta Selatan");
  const [sellerEmail, setSellerEmail] = useState("billing@studiokreatif.com");
  const [sellerPhone, setSellerPhone] = useState("+62 812-3456-7890");
  const [bankDetails, setBankDetails] = useState("BCA 8800123456 a/n PT Studio Desain");

  // Client info
  const [clientName, setClientName] = useState("Bpk. Hendra Gunawan");
  const [clientCompany, setClientCompany] = useState("PT Solusi Digital");
  const [clientAddress, setClientAddress] = useState("Jl. Gatot Subroto Kav. 12, Jakarta");
  const [clientEmail, setClientEmail] = useState("hendra@solusidigital.co.id");

  // Items
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: "Jasa Perancangan UI/UX Desain Aplikasi Web", quantity: 1, unitPrice: 1500 },
    { description: "Pengembangan Frontend Next.js & Tailwind CSS", quantity: 1, unitPrice: 2000 },
  ]);

  const [taxRatePercent, setTaxRatePercent] = useState(11);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [notes, setNotes] = useState("Terima kasih atas kerjasamanya. Pembayaran jatuh tempo dalam 14 hari kerja.");

  const [processing, setProcessing] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function addItem() {
    setItems((prev) => [...prev, { description: "", quantity: 1, unitPrice: 0 }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof InvoiceItem, val: string | number) {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  }

  const subtotal = items.reduce((sum, item) => sum + (item.quantity || 1) * (item.unitPrice || 0), 0);
  const taxAmount = (subtotal * taxRatePercent) / 100;
  const grandTotal = Math.max(0, subtotal + taxAmount - discountAmount);

  async function handleDownload() {
    setProcessing(true);
    setError(null);

    try {
      const blob = await generateInvoicePdf({
        invoiceNumber,
        date,
        dueDate,
        currency,
        sellerName,
        sellerAddress,
        sellerEmail,
        sellerPhone,
        clientName: clientCompany ? `${clientName} (${clientCompany})` : clientName,
        clientAddress,
        clientEmail,
        items,
        taxRatePercent,
        discountAmount,
        notes,
        bankDetails,
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice-${invoiceNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat PDF invoice");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <ToolShell title={t("title")} description={t("description")} wide>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
            Professional PDF Invoice
          </span>
          <span className="text-xs text-zinc-500">Live Real-time Calculation</span>
        </div>
        <button
          type="button"
          onClick={() => setShowLivePreview(!showLivePreview)}
          className="hidden lg:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-zinc-200 dark:border-white/10 hover:border-teal-500 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5 text-teal-600" />
          <span>{showLivePreview ? "Sembunyikan Pratinjau" : "Tampilkan Pratinjau"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className={showLivePreview ? "space-y-6 lg:col-span-7" : "space-y-6 lg:col-span-12"}>
        {/* Top Info Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-white/10">
          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Nomor Invoice</label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-bold"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Tanggal Terbit</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Jatuh Tempo</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Mata Uang</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-bold"
            >
              <option value="$">USD - United States ($)</option>
              <option value="Rp">IDR - Indonesia (Rp)</option>
              <option value="RM">MYR - Malaysia (RM)</option>
              <option value="¥">JPY - Japan (¥)</option>
              <option value="€">EUR - Europe (€)</option>
              <option value="£">GBP - United Kingdom (£)</option>
              <option value="S$">SGD - Singapore (S$)</option>
            </select>
          </div>
        </div>

        {/* Sender & Client Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Seller */}
          <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-white/10 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 block">
              Penerbit (Dari / Perusahaan Anda)
            </span>
            <input
              type="text"
              value={sellerName}
              onChange={(e) => setSellerName(e.target.value)}
              placeholder="Nama Perusahaan / Freelancer"
              className="w-full rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-semibold"
            />
            <input
              type="text"
              value={sellerAddress}
              onChange={(e) => setSellerAddress(e.target.value)}
              placeholder="Alamat Lengkap"
              className="w-full rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="email"
                value={sellerEmail}
                onChange={(e) => setSellerEmail(e.target.value)}
                placeholder="Email"
                className="w-full rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs"
              />
              <input
                type="text"
                value={sellerPhone}
                onChange={(e) => setSellerPhone(e.target.value)}
                placeholder="No Telepon"
                className="w-full rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs"
              />
            </div>
          </div>

          {/* Client */}
          <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-white/10 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 block">
              Klien (Ditujukan Kepada)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Nama Kontak"
                className="w-full rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-semibold"
              />
              <input
                type="text"
                value={clientCompany}
                onChange={(e) => setClientCompany(e.target.value)}
                placeholder="Nama Perusahaan Klien"
                className="w-full rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs"
              />
            </div>
            <input
              type="text"
              value={clientAddress}
              onChange={(e) => setClientAddress(e.target.value)}
              placeholder="Alamat Klien"
              className="w-full rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs"
            />
            <input
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="Email Klien"
              className="w-full rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs"
            />
          </div>
        </div>

        {/* Itemized Table */}
        <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-white/10 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Daftar Barang / Jasa
            </span>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Baris</span>
            </button>
          </div>

          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => updateItem(idx, "description", e.target.value)}
                  placeholder="Deskripsi layanan atau barang..."
                  className="flex-1 rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-3 py-2 text-xs"
                />
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                  placeholder="Qty"
                  className="w-20 rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-center"
                />
                <input
                  type="number"
                  min={0}
                  value={item.unitPrice}
                  onChange={(e) => updateItem(idx, "unitPrice", Number(e.target.value))}
                  placeholder="Harga"
                  className="w-28 rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-3 py-2 text-xs"
                />
                <div className="w-28 text-right font-bold text-xs">
                  {currency} {((item.quantity || 1) * (item.unitPrice || 0)).toLocaleString()}
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="p-1.5 text-zinc-400 hover:text-red-600 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Totals Section */}
          <div className="border-t border-zinc-200 dark:border-white/10 pt-4 flex justify-end">
            <div className="w-72 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Subtotal:</span>
                <span className="font-semibold">{currency} {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Pajak / PPN (%):</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={taxRatePercent}
                  onChange={(e) => setTaxRatePercent(Number(e.target.value))}
                  className="w-16 rounded-lg border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-2 py-0.5 text-xs text-right"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Diskon ({currency}):</span>
                <input
                  type="number"
                  min={0}
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  className="w-24 rounded-lg border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-2 py-0.5 text-xs text-right"
                />
              </div>
              <div className="flex justify-between text-sm font-bold pt-2 border-t border-zinc-200 dark:border-white/10 text-teal-600 dark:text-teal-400">
                <span>Total Tagihan:</span>
                <span>{currency} {grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bank & Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Rekening & Instruksi Pembayaran</label>
            <input
              type="text"
              value={bankDetails}
              onChange={(e) => setBankDetails(e.target.value)}
              placeholder="Contoh: BCA 1234567890 a/n Nama Perusahaan"
              className="mt-1 w-full rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Catatan / Syarat Ketentuan</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan tambahan di bagian bawah invoice..."
              className="mt-1 w-full rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs"
            />
          </div>
        </div>

        <ErrorBanner message={error} />

        <div className="flex justify-end pt-4 border-t border-zinc-200/60 dark:border-white/10">
          <Button
            type="button"
            loading={processing}
            onClick={handleDownload}
            className="flex items-center gap-2 px-8 py-3.5 text-sm"
          >
            <Download className="w-4 h-4" />
            <span>{processing ? "Membuat PDF..." : "Unduh PDF Invoice Resmi"}</span>
          </Button>
        </div>
      </div>

      {/* Live A4 Sheet Preview (Right Column) */}
      {showLivePreview && (
        <div className="hidden lg:block lg:col-span-5 sticky top-24">
          <div className="rounded-3xl border border-zinc-200/90 dark:border-white/15 bg-white dark:bg-zinc-900 shadow-2xl p-6 text-zinc-900 dark:text-zinc-100 text-xs space-y-5 transition-all">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/10 pb-4">
              <div>
                <h3 className="font-extrabold text-base tracking-tight text-teal-600 dark:text-teal-400">INVOICE</h3>
                <p className="font-mono text-[11px] text-zinc-500 mt-0.5">#{invoiceNumber || "INV-001"}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-zinc-400 uppercase tracking-widest block font-bold">Total Due</span>
                <span className="font-extrabold text-lg text-zinc-900 dark:text-white">
                  {currency} {grandTotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3 text-[11px] bg-zinc-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-zinc-100 dark:border-white/5">
              <div>
                <span className="text-zinc-400 block text-[10px]">Issued Date:</span>
                <span className="font-semibold">{date || "-"}</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[10px]">Due Date:</span>
                <span className="font-semibold text-rose-600 dark:text-rose-400">{dueDate || "-"}</span>
              </div>
            </div>

            {/* Sender & Recipient */}
            <div className="grid grid-cols-2 gap-4 text-[11px]">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-teal-600 dark:text-teal-400">From</span>
                <p className="font-bold">{sellerName || "Your Company"}</p>
                <p className="text-zinc-500 text-[10px] leading-relaxed">{sellerAddress}</p>
                <p className="text-zinc-400 text-[10px]">{sellerEmail}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-zinc-400">Billed To</span>
                <p className="font-bold">{clientName || "Client Name"}</p>
                {clientCompany && <p className="text-zinc-600 dark:text-zinc-300 text-[10px]">{clientCompany}</p>}
                <p className="text-zinc-500 text-[10px] leading-relaxed">{clientAddress}</p>
              </div>
            </div>

            {/* Mini Items Table */}
            <div className="space-y-1.5 border-t border-zinc-200 dark:border-white/10 pt-3">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Items Breakdown</span>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-zinc-100 dark:divide-white/5">
                {items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-center pt-1.5 text-[11px]">
                    <div className="truncate pr-2">
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">{it.description || "Item description"}</span>
                      <span className="text-zinc-400 text-[10px] block">Qty: {it.quantity} × {currency} {it.unitPrice.toLocaleString()}</span>
                    </div>
                    <span className="font-semibold font-mono shrink-0">
                      {currency} {((it.quantity || 1) * (it.unitPrice || 0)).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Calculation */}
            <div className="border-t border-zinc-200 dark:border-white/10 pt-3 space-y-1 text-[11px]">
              <div className="flex justify-between text-zinc-500">
                <span>Subtotal:</span>
                <span>{currency} {subtotal.toLocaleString()}</span>
              </div>
              {taxRatePercent > 0 && (
                <div className="flex justify-between text-zinc-500">
                  <span>Tax ({taxRatePercent}%):</span>
                  <span>{currency} {taxAmount.toLocaleString()}</span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount:</span>
                  <span>-{currency} {discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold border-t border-zinc-200 dark:border-white/10 pt-2 text-teal-600 dark:text-teal-400">
                <span>Total Amount:</span>
                <span>{currency} {grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment Details */}
            {bankDetails && (
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl text-[10px] border border-zinc-100 dark:border-white/5">
                <span className="font-bold text-zinc-700 dark:text-zinc-300 block">Bank / Payment Instructions:</span>
                <p className="text-zinc-500 mt-0.5">{bankDetails}</p>
              </div>
            )}

            <Button
              type="button"
              loading={processing}
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 py-3 mt-2 shadow-lg"
            >
              <Download className="w-4 h-4" />
              <span>{processing ? "Membuat PDF..." : "Unduh PDF Invoice Sekarang"}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  </ToolShell>
);
}
