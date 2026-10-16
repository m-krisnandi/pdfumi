package com.pdfumi.api.modules.kwitansi.infrastructure;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Image;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfContentByte;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.pdfumi.api.config.PdfumiProperties;
import com.pdfumi.api.modules.kwitansi.application.KwitansiCommand;
import com.pdfumi.api.modules.kwitansi.application.KwitansiPdfGenerator;
import com.pdfumi.api.modules.kwitansi.domain.Terbilang;
import org.springframework.stereotype.Component;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Component
public class OpenPdfKwitansiGenerator implements KwitansiPdfGenerator {

	private static final Color INK = new Color(0x1f, 0x2a, 0x24);
	private static final Color MUTED = new Color(0x5a, 0x66, 0x5f);
	private static final Color FRAME = new Color(0x2d, 0x5a, 0x45);

	private final String brandFooter;

	public OpenPdfKwitansiGenerator(PdfumiProperties properties) {
		this.brandFooter = properties.brandFooter();
	}

	@Override
	public byte[] generate(KwitansiCommand request, byte[] logoImage, byte[] signatureImage) {
		try {
			ByteArrayOutputStream out = new ByteArrayOutputStream();
			Document document = new Document(PageSize.A5.rotate(), 42, 42, 40, 36);
			PdfWriter writer = PdfWriter.getInstance(document, out);
			document.open();

			drawFrame(writer, document.getPageSize());

			Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, INK);
			Font orgFont = FontFactory.getFont(FontFactory.HELVETICA, 10, MUTED);
			Font labelFont = FontFactory.getFont(FontFactory.HELVETICA, 10, MUTED);
			Font valueFont = FontFactory.getFont(FontFactory.HELVETICA, 11, INK);
			Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, INK);
			Font amountFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, INK);

			placeLogo(document, logoImage);

			String organization = blankTo(request.organization(), "");
			if (!organization.isBlank()) {
				Paragraph org = new Paragraph(organization, orgFont);
				org.setAlignment(Element.ALIGN_CENTER);
				org.setSpacingAfter(4);
				document.add(org);
			}

			Paragraph title = new Paragraph("KWITANSI", titleFont);
			title.setAlignment(Element.ALIGN_CENTER);
			title.setSpacingBefore(organization.isBlank() && (logoImage == null || logoImage.length == 0) ? 0 : 2);
			document.add(title);

			Paragraph nomorLine = new Paragraph("No. " + blankToDash(request.nomor()), labelFont);
			nomorLine.setAlignment(Element.ALIGN_CENTER);
			nomorLine.setSpacingAfter(14);
			document.add(nomorLine);

			PdfPTable table = new PdfPTable(new float[]{2.2f, 7.8f});
			table.setWidthPercentage(100);
			addRow(table, "Telah terima dari", request.diterimaDari(), labelFont, valueFont);
			addRow(table, "Uang sejumlah", formatRp(request.jumlah()), labelFont, amountFont);
			addRow(table, "Terbilang", Terbilang.dari(request.jumlah()), labelFont, boldFont);
			addRow(table, "Untuk pembayaran", request.untukPembayaran(), labelFont, valueFont);
			document.add(table);

			String kota = blankTo(request.kota(), "Jakarta");
			String tanggal = blankTo(
					request.tanggal(),
					LocalDate.now().format(DateTimeFormatter.ofPattern("d MMMM yyyy", Locale.forLanguageTag("id-ID")))
			);

			Paragraph place = new Paragraph(kota + ", " + tanggal, valueFont);
			place.setSpacingBefore(22);
			place.setAlignment(Element.ALIGN_RIGHT);
			document.add(place);

			Paragraph penerimaLabel = new Paragraph("Penerima,", labelFont);
			penerimaLabel.setAlignment(Element.ALIGN_RIGHT);
			penerimaLabel.setSpacingBefore(8);
			document.add(penerimaLabel);

			placeSignature(document, signatureImage);

			Paragraph penerimaName = new Paragraph(blankToDash(request.penerimaNama()), boldFont);
			penerimaName.setAlignment(Element.ALIGN_RIGHT);
			penerimaName.setSpacingBefore(signatureImage != null && signatureImage.length > 0 ? 6 : 40);
			document.add(penerimaName);

			if (request.brandFooterEnabled()) {
				Paragraph footer = new Paragraph(brandFooter, FontFactory.getFont(FontFactory.HELVETICA, 8, Color.GRAY));
				footer.setSpacingBefore(22);
				footer.setAlignment(Element.ALIGN_CENTER);
				document.add(footer);
			}

			document.close();
			return out.toByteArray();
		} catch (Exception e) {
			throw new IllegalStateException("Gagal membuat kwitansi PDF", e);
		}
	}

	private static void drawFrame(PdfWriter writer, Rectangle page) {
		PdfContentByte cb = writer.getDirectContent();
		float m = 16f;
		cb.setColorStroke(FRAME);
		cb.setLineWidth(1.6f);
		cb.rectangle(m, m, page.getWidth() - 2 * m, page.getHeight() - 2 * m);
		cb.stroke();
		cb.setLineWidth(0.5f);
		cb.rectangle(m + 4, m + 4, page.getWidth() - 2 * m - 8, page.getHeight() - 2 * m - 8);
		cb.stroke();
	}

	private static void placeLogo(Document document, byte[] logoBytes) {
		if (logoBytes == null || logoBytes.length == 0) {
			return;
		}
		try {
			Image logo = Image.getInstance(logoBytes);
			logo.scaleToFit(72, 40);
			logo.setAlignment(Element.ALIGN_CENTER);
			logo.setSpacingAfter(6);
			document.add(logo);
		} catch (Exception ignored) {
			// skip invalid logo
		}
	}

	private static void placeSignature(Document document, byte[] signatureBytes) {
		if (signatureBytes == null || signatureBytes.length == 0) {
			return;
		}
		try {
			Image sig = Image.getInstance(signatureBytes);
			sig.scaleToFit(110, 42);
			sig.setAlignment(Element.ALIGN_RIGHT);
			sig.setSpacingBefore(10);
			document.add(sig);
		} catch (Exception ignored) {
			// skip invalid signature
		}
	}

	private static void addRow(PdfPTable table, String label, String value, Font labelFont, Font valueFont) {
		PdfPCell c1 = new PdfPCell(new Phrase(label, labelFont));
		PdfPCell c2 = new PdfPCell(new Phrase(value, valueFont));
		c1.setBorderWidth(0);
		c2.setBorderWidth(0);
		c1.setPaddingBottom(8);
		c2.setPaddingBottom(8);
		table.addCell(c1);
		table.addCell(c2);
	}

	private static String formatRp(BigDecimal amount) {
		return NumberFormat.getCurrencyInstance(Locale.forLanguageTag("id-ID")).format(amount);
	}

	private static String blankToDash(String value) {
		return blankTo(value, "-");
	}

	private static String blankTo(String value, String fallback) {
		return value == null || value.isBlank() ? fallback : value;
	}
}
