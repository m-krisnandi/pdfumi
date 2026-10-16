import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { PAGE_SIZES } from "@/lib/pdfLibUtils";

export type InvoiceItem = {
  description: string;
  quantity: number;
  unitPrice: number;
};

export type InvoicePayload = {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  currency: string;
  sellerName: string;
  sellerAddress: string;
  sellerEmail: string;
  sellerPhone: string;
  clientName: string;
  clientCompany?: string;
  clientAddress: string;
  clientEmail?: string;
  items: InvoiceItem[];
  taxRatePercent?: number;
  discountAmount?: number;
  notes?: string;
  bankDetails?: string;
  signatureBase64?: string;
};

export async function generateInvoicePdf(data: InvoicePayload): Promise<Blob> {
  const doc = await PDFDocument.create();
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const [pageW, pageH] = PAGE_SIZES.A4;
  const page = doc.addPage([pageW, pageH]);

  const margin = 45;
  let cursorY = pageH - margin;

  // Header Title
  page.drawText("INVOICE", {
    x: margin,
    y: cursorY - 24,
    size: 24,
    font: fontBold,
    color: rgb(0.12, 0.45, 0.42), // Teal accent
  });

  // Invoice Number & Dates (Right side)
  page.drawText(`Invoice #: ${data.invoiceNumber || "INV-001"}`, {
    x: pageW - margin - 200,
    y: cursorY - 14,
    size: 11,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  page.drawText(`Date: ${data.date || new Date().toISOString().slice(0, 10)}`, {
    x: pageW - margin - 200,
    y: cursorY - 28,
    size: 9,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.3),
  });
  if (data.dueDate) {
    page.drawText(`Due Date: ${data.dueDate}`, {
      x: pageW - margin - 200,
      y: cursorY - 42,
      size: 9,
      font: fontRegular,
      color: rgb(0.3, 0.3, 0.3),
    });
  }

  cursorY -= 70;

  // Divider
  page.drawLine({
    start: { x: margin, y: cursorY },
    end: { x: pageW - margin, y: cursorY },
    thickness: 1,
    color: rgb(0.85, 0.85, 0.85),
  });

  cursorY -= 20;

  // From & Bill To
  page.drawText("FROM:", { x: margin, y: cursorY, size: 9, font: fontBold, color: rgb(0.4, 0.4, 0.4) });
  page.drawText("BILL TO:", { x: margin + 260, y: cursorY, size: 9, font: fontBold, color: rgb(0.4, 0.4, 0.4) });

  cursorY -= 14;
  page.drawText(data.sellerName || "Your Company", { x: margin, y: cursorY, size: 10, font: fontBold });
  page.drawText(data.clientName || "Client Name", { x: margin + 260, y: cursorY, size: 10, font: fontBold });

  cursorY -= 13;
  if (data.sellerAddress) {
    page.drawText(data.sellerAddress, { x: margin, y: cursorY, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
  }
  if (data.clientAddress) {
    page.drawText(data.clientAddress, { x: margin + 260, y: cursorY, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
  }

  cursorY -= 13;
  if (data.sellerEmail || data.sellerPhone) {
    page.drawText(`${data.sellerEmail} | ${data.sellerPhone}`, { x: margin, y: cursorY, size: 9, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });
  }
  if (data.clientEmail) {
    page.drawText(data.clientEmail, { x: margin + 260, y: cursorY, size: 9, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });
  }

  cursorY -= 35;

  // Table Header
  const colDesc = margin;
  const colQty = pageW - margin - 220;
  const colRate = pageW - margin - 140;
  const colAmount = pageW - margin - 60;

  page.drawRectangle({
    x: margin,
    y: cursorY - 5,
    width: pageW - margin * 2,
    height: 24,
    color: rgb(0.95, 0.96, 0.97),
  });

  page.drawText("Description", { x: colDesc + 8, y: cursorY + 2, size: 9, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
  page.drawText("Qty", { x: colQty, y: cursorY + 2, size: 9, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
  page.drawText("Rate", { x: colRate, y: cursorY + 2, size: 9, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
  page.drawText("Amount", { x: colAmount, y: cursorY + 2, size: 9, font: fontBold, color: rgb(0.2, 0.2, 0.2) });

  cursorY -= 20;

  // Table Rows
  let subtotal = 0;
  const currency = data.currency || "$";

  for (const item of data.items) {
    const itemTotal = (item.quantity || 1) * (item.unitPrice || 0);
    subtotal += itemTotal;

    page.drawText(item.description || "Service item", { x: colDesc + 8, y: cursorY, size: 9, font: fontRegular });
    page.drawText(String(item.quantity || 1), { x: colQty, y: cursorY, size: 9, font: fontRegular });
    page.drawText(`${currency} ${(item.unitPrice || 0).toLocaleString()}`, { x: colRate, y: cursorY, size: 9, font: fontRegular });
    page.drawText(`${currency} ${itemTotal.toLocaleString()}`, { x: colAmount, y: cursorY, size: 9, font: fontBold });

    cursorY -= 18;
    page.drawLine({
      start: { x: margin, y: cursorY + 6 },
      end: { x: pageW - margin, y: cursorY + 6 },
      thickness: 0.5,
      color: rgb(0.9, 0.9, 0.9),
    });
  }

  cursorY -= 15;

  // Totals Area
  const taxRate = data.taxRatePercent || 0;
  const taxAmount = (subtotal * taxRate) / 100;
  const discount = data.discountAmount || 0;
  const grandTotal = Math.max(0, subtotal + taxAmount - discount);

  const totalLabelX = pageW - margin - 190;
  const totalValX = pageW - margin - 70;

  page.drawText("Subtotal:", { x: totalLabelX, y: cursorY, size: 9, font: fontRegular });
  page.drawText(`${currency} ${subtotal.toLocaleString()}`, { x: totalValX, y: cursorY, size: 9, font: fontRegular });

  cursorY -= 16;
  if (discount > 0) {
    page.drawText("Discount:", { x: totalLabelX, y: cursorY, size: 9, font: fontRegular });
    page.drawText(`-${currency} ${discount.toLocaleString()}`, { x: totalValX, y: cursorY, size: 9, font: fontRegular });
    cursorY -= 16;
  }

  if (taxRate > 0) {
    page.drawText(`Tax (${taxRate}%):`, { x: totalLabelX, y: cursorY, size: 9, font: fontRegular });
    page.drawText(`${currency} ${taxAmount.toLocaleString()}`, { x: totalValX, y: cursorY, size: 9, font: fontRegular });
    cursorY -= 16;
  }

  // Grand Total Highlight
  page.drawRectangle({
    x: totalLabelX - 8,
    y: cursorY - 6,
    width: pageW - margin - totalLabelX + 8,
    height: 24,
    color: rgb(0.12, 0.45, 0.42),
  });
  page.drawText("Total Due:", { x: totalLabelX, y: cursorY + 1, size: 10, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText(`${currency} ${grandTotal.toLocaleString()}`, { x: totalValX - 10, y: cursorY + 1, size: 11, font: fontBold, color: rgb(1, 1, 1) });

  cursorY -= 45;

  // Notes & Payment details
  if (data.bankDetails) {
    page.drawText("Payment Instructions:", { x: margin, y: cursorY, size: 9, font: fontBold });
    cursorY -= 13;
    page.drawText(data.bankDetails, { x: margin, y: cursorY, size: 8.5, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
    cursorY -= 20;
  }

  if (data.notes) {
    page.drawText("Notes / Terms:", { x: margin, y: cursorY, size: 9, font: fontBold });
    cursorY -= 13;
    page.drawText(data.notes, { x: margin, y: cursorY, size: 8.5, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
  }

  // Signature if present
  if (data.signatureBase64) {
    try {
      const sigBytes = await (await fetch(data.signatureBase64)).arrayBuffer();
      const sigImg = await doc.embedPng(sigBytes);
      const sigW = 100;
      const sigH = (sigImg.height / sigImg.width) * sigW;
      page.drawImage(sigImg, {
        x: pageW - margin - 120,
        y: 60,
        width: sigW,
        height: sigH,
      });
      page.drawLine({
        start: { x: pageW - margin - 130, y: 55 },
        end: { x: pageW - margin, y: 55 },
        thickness: 0.5,
        color: rgb(0.5, 0.5, 0.5),
      });
      page.drawText("Authorized Signature", {
        x: pageW - margin - 120,
        y: 42,
        size: 8,
        font: fontRegular,
        color: rgb(0.4, 0.4, 0.4),
      });
    } catch {
      // Signature embed error fallback
    }
  }

  const outputBytes = await doc.save();
  return new Blob([outputBytes.buffer as ArrayBuffer], { type: "application/pdf" });
}

export type SuratResmiPayload = {
  instansi: string;
  alamatInstansi: string;
  kontakInstansi: string;
  nomorSurat: string;
  lampiran: string;
  perihal: string;
  tanggalKota: string;
  kepada: string;
  tujuanAlamat: string;
  salamPembuka: string;
  paragrafPembuka: string;
  paragrafIsi: string;
  paragrafPenutup: string;
  penandatanganJabatan: string;
  penandatanganNama: string;
  signatureBase64?: string;
};

export async function generateSuratResmiPdf(data: SuratResmiPayload): Promise<Blob> {
  const doc = await PDFDocument.create();
  const fontRegular = await doc.embedFont(StandardFonts.TimesRoman);
  const fontBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const [pageW, pageH] = PAGE_SIZES.A4;
  const page = doc.addPage([pageW, pageH]);

  const margin = 54; // Standard 0.75 inch margin
  let cursorY = pageH - margin;

  // KOP SURAT
  if (data.instansi) {
    const titleW = fontBold.widthOfTextAtSize(data.instansi.toUpperCase(), 14);
    page.drawText(data.instansi.toUpperCase(), {
      x: (pageW - titleW) / 2,
      y: cursorY - 14,
      size: 14,
      font: fontBold,
    });
    cursorY -= 20;

    if (data.alamatInstansi) {
      const addrW = fontRegular.widthOfTextAtSize(data.alamatInstansi, 9.5);
      page.drawText(data.alamatInstansi, {
        x: (pageW - addrW) / 2,
        y: cursorY - 10,
        size: 9.5,
        font: fontRegular,
      });
      cursorY -= 14;
    }

    if (data.kontakInstansi) {
      const contactW = fontRegular.widthOfTextAtSize(data.kontakInstansi, 9);
      page.drawText(data.kontakInstansi, {
        x: (pageW - contactW) / 2,
        y: cursorY - 10,
        size: 9,
        font: fontRegular,
      });
      cursorY -= 16;
    }

    // Double line kop surat
    page.drawLine({
      start: { x: margin, y: cursorY },
      end: { x: pageW - margin, y: cursorY },
      thickness: 2,
      color: rgb(0, 0, 0),
    });
    page.drawLine({
      start: { x: margin, y: cursorY - 2 },
      end: { x: pageW - margin, y: cursorY - 2 },
      thickness: 0.5,
      color: rgb(0, 0, 0),
    });
    cursorY -= 24;
  }

  // Tanggal & Kota (Right aligned)
  const tglText = data.tanggalKota || "Jakarta, 13 Oktober 2026";
  const tglW = fontRegular.widthOfTextAtSize(tglText, 11);
  page.drawText(tglText, {
    x: pageW - margin - tglW,
    y: cursorY,
    size: 11,
    font: fontRegular,
  });

  cursorY -= 18;

  // Metadata Surat (Nomor, Lampiran, Perihal)
  page.drawText(`Nomor     : ${data.nomorSurat || "001/SR/X/2026"}`, { x: margin, y: cursorY, size: 11, font: fontRegular });
  cursorY -= 16;
  page.drawText(`Lampiran  : ${data.lampiran || "-"}`, { x: margin, y: cursorY, size: 11, font: fontRegular });
  cursorY -= 16;
  page.drawText(`Perihal   : ${data.perihal || "Pemberitahuan Resmi"}`, { x: margin, y: cursorY, size: 11, font: fontBold });

  cursorY -= 28;

  // Kepada Yth
  page.drawText("Kepada Yth.", { x: margin, y: cursorY, size: 11, font: fontRegular });
  cursorY -= 16;
  page.drawText(data.kepada || "Bapak / Ibu", { x: margin, y: cursorY, size: 11, font: fontBold });
  cursorY -= 16;
  if (data.tujuanAlamat) {
    page.drawText(data.tujuanAlamat, { x: margin, y: cursorY, size: 11, font: fontRegular });
    cursorY -= 16;
  }

  cursorY -= 16;

  // Salam Pembuka
  page.drawText(data.salamPembuka || "Dengan hormat,", { x: margin, y: cursorY, size: 11, font: fontRegular });
  cursorY -= 22;

  // Paragraph wrapping helper
  const drawParagraph = (text: string) => {
    const maxWidth = pageW - margin * 2;
    const words = text.split(" ");
    let line = "";
    for (const w of words) {
      const testLine = line ? `${line} ${w}` : w;
      const testW = fontRegular.widthOfTextAtSize(testLine, 11);
      if (testW > maxWidth) {
        page.drawText(line, { x: margin, y: cursorY, size: 11, font: fontRegular });
        cursorY -= 17;
        line = w;
      } else {
        line = testLine;
      }
    }
    if (line) {
      page.drawText(line, { x: margin, y: cursorY, size: 11, font: fontRegular });
      cursorY -= 22;
    }
  };

  if (data.paragrafPembuka) drawParagraph(data.paragrafPembuka);
  if (data.paragrafIsi) drawParagraph(data.paragrafIsi);
  if (data.paragrafPenutup) drawParagraph(data.paragrafPenutup);

  cursorY -= 10;

  // Penandatangan (Right side)
  const sigX = pageW - margin - 180;
  page.drawText(data.penandatanganJabatan || "Hormat kami,", {
    x: sigX,
    y: cursorY,
    size: 11,
    font: fontRegular,
  });

  cursorY -= 65;

  if (data.signatureBase64) {
    try {
      const sigBytes = await (await fetch(data.signatureBase64)).arrayBuffer();
      const sigImg = await doc.embedPng(sigBytes);
      page.drawImage(sigImg, {
        x: sigX,
        y: cursorY + 5,
        width: 100,
        height: 50,
      });
    } catch {
      // Fallback
    }
  }

  page.drawText(data.penandatanganNama || "( ........................................ )", {
    x: sigX,
    y: cursorY,
    size: 11,
    font: fontBold,
  });
  page.drawLine({
    start: { x: sigX, y: cursorY - 2 },
    end: { x: sigX + 160, y: cursorY - 2 },
    thickness: 0.8,
    color: rgb(0, 0, 0),
  });

  const outputBytes = await doc.save();
  return new Blob([outputBytes.buffer as ArrayBuffer], { type: "application/pdf" });
}

export type KontrakPayload = {
  judul: string;
  nomorKontrak: string;
  tanggalTempat: string;
  pihak1Nama: string;
  pihak1Jabatan: string;
  pihak1Instansi: string;
  pihak1Alamat: string;
  pihak2Nama: string;
  pihak2Jabatan: string;
  pihak2Instansi: string;
  pihak2Alamat: string;
  pasalList: { judul: string; isi: string }[];
  penutup: string;
  signature1Base64?: string;
  signature2Base64?: string;
};

export async function generateKontrakPdf(data: KontrakPayload): Promise<Blob> {
  const doc = await PDFDocument.create();
  const fontRegular = await doc.embedFont(StandardFonts.TimesRoman);
  const fontBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const [pageW, pageH] = PAGE_SIZES.A4;
  let page = doc.addPage([pageW, pageH]);

  const margin = 54;
  let cursorY = pageH - margin;

  const ensureSpace = (needed: number) => {
    if (cursorY - needed < margin) {
      page = doc.addPage([pageW, pageH]);
      cursorY = pageH - margin;
    }
  };

  // Judul Kontrak
  const titleText = (data.judul || "SURAT PERJANJIAN KERJA").toUpperCase();
  const titleW = fontBold.widthOfTextAtSize(titleText, 13);
  page.drawText(titleText, {
    x: (pageW - titleW) / 2,
    y: cursorY - 10,
    size: 13,
    font: fontBold,
  });
  cursorY -= 26;

  if (data.nomorKontrak) {
    const numText = `Nomor: ${data.nomorKontrak}`;
    const numW = fontRegular.widthOfTextAtSize(numText, 10);
    page.drawText(numText, {
      x: (pageW - numW) / 2,
      y: cursorY,
      size: 10,
      font: fontRegular,
    });
    cursorY -= 24;
  }

  // Tanggal & Pembukaan
  const introText = `Pada hari ini, ${data.tanggalTempat || "tanggal 13 Oktober 2026"}, telah dibuat dan disepakati perjanjian kerjasama oleh dan antara:`;
  page.drawText(introText, { x: margin, y: cursorY, size: 10, font: fontRegular });
  cursorY -= 20;

  // Pihak 1
  page.drawText("1. PIHAK PERTAMA:", { x: margin, y: cursorY, size: 10, font: fontBold });
  cursorY -= 15;
  page.drawText(`   Nama: ${data.pihak1Nama || "-"}`, { x: margin, y: cursorY, size: 9.5, font: fontRegular });
  cursorY -= 14;
  page.drawText(`   Jabatan: ${data.pihak1Jabatan || "-"} (${data.pihak1Instansi || "-"})`, { x: margin, y: cursorY, size: 9.5, font: fontRegular });
  cursorY -= 14;
  page.drawText(`   Alamat: ${data.pihak1Alamat || "-"}`, { x: margin, y: cursorY, size: 9.5, font: fontRegular });
  cursorY -= 20;

  // Pihak 2
  page.drawText("2. PIHAK KEDUA:", { x: margin, y: cursorY, size: 10, font: fontBold });
  cursorY -= 15;
  page.drawText(`   Nama: ${data.pihak2Nama || "-"}`, { x: margin, y: cursorY, size: 9.5, font: fontRegular });
  cursorY -= 14;
  page.drawText(`   Jabatan: ${data.pihak2Jabatan || "-"} (${data.pihak2Instansi || "-"})`, { x: margin, y: cursorY, size: 9.5, font: fontRegular });
  cursorY -= 14;
  page.drawText(`   Alamat: ${data.pihak2Alamat || "-"}`, { x: margin, y: cursorY, size: 9.5, font: fontRegular });
  cursorY -= 24;

  const pasalIntro = "Kedua belah pihak sepakat mengikatkan diri dalam perjanjian dengan pasal-pasal sebagai berikut:";
  page.drawText(pasalIntro, { x: margin, y: cursorY, size: 9.5, font: fontRegular });
  cursorY -= 22;

  // Pasal-pasal
  for (let idx = 0; idx < (data.pasalList || []).length; idx++) {
    const pasal = data.pasalList[idx];
    ensureSpace(60);

    const pasalTitle = `PASAL ${idx + 1}: ${(pasal.judul || "").toUpperCase()}`;
    const pTitleW = fontBold.widthOfTextAtSize(pasalTitle, 10);
    page.drawText(pasalTitle, {
      x: (pageW - pTitleW) / 2,
      y: cursorY,
      size: 10,
      font: fontBold,
    });
    cursorY -= 16;

    // Wrap text
    const maxWidth = pageW - margin * 2;
    const words = (pasal.isi || "").split(" ");
    let line = "";
    for (const w of words) {
      const testLine = line ? `${line} ${w}` : w;
      if (fontRegular.widthOfTextAtSize(testLine, 9.5) > maxWidth) {
        ensureSpace(16);
        page.drawText(line, { x: margin, y: cursorY, size: 9.5, font: fontRegular });
        cursorY -= 14;
        line = w;
      } else {
        line = testLine;
      }
    }
    if (line) {
      ensureSpace(16);
      page.drawText(line, { x: margin, y: cursorY, size: 9.5, font: fontRegular });
      cursorY -= 20;
    }
  }

  // Penutup
  ensureSpace(120);
  const penutupText = data.penutup || "Demikian surat perjanjian ini dibuat dalam 2 (dua) rangkap bermaterai cukup dan memiliki kekuatan hukum yang sama.";
  page.drawText(penutupText, { x: margin, y: cursorY, size: 9.5, font: fontRegular });
  cursorY -= 35;

  // Dua Kolom Tanda Tangan
  const col1X = margin + 30;
  const col2X = pageW - margin - 170;

  page.drawText("PIHAK PERTAMA", { x: col1X, y: cursorY, size: 10, font: fontBold });
  page.drawText("PIHAK KEDUA", { x: col2X, y: cursorY, size: 10, font: fontBold });

  cursorY -= 55;

  page.drawText(data.pihak1Nama || "( Pihak Pertama )", { x: col1X, y: cursorY, size: 9.5, font: fontRegular });
  page.drawText(data.pihak2Nama || "( Pihak Kedua )", { x: col2X, y: cursorY, size: 9.5, font: fontRegular });

  const outputBytes = await doc.save();
  return new Blob([outputBytes.buffer as ArrayBuffer], { type: "application/pdf" });
}
