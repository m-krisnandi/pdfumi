package com.pdfumi.api.modules.certificate.infrastructure;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Image;
import com.lowagie.text.PageSize;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.PdfContentByte;
import com.lowagie.text.pdf.PdfWriter;
import com.pdfumi.api.modules.certificate.application.CertificatePdfGenerator;
import com.pdfumi.api.modules.certificate.domain.CertificateTemplate;
import org.springframework.stereotype.Component;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.util.List;

@Component
public class OpenPdfCertificateGenerator implements CertificatePdfGenerator {

	private static final float FOOTER_RESERVE = 128f;
	private static final float QR_SIZE = 52f;
	private static final float EDGE = 56f;

	private final ZxingQrCodeEncoder qrCodeEncoder;

	public OpenPdfCertificateGenerator(ZxingQrCodeEncoder qrCodeEncoder) {
		this.qrCodeEncoder = qrCodeEncoder;
	}

	@Override
	public byte[] generate(CertificateRenderModel model) {
		try {
			ByteArrayOutputStream out = new ByteArrayOutputStream();
			// True landscape MediaBox (no /Rotate) so preview coords match stamped overlays.
			Rectangle landscape = new Rectangle(PageSize.A4.getHeight(), PageSize.A4.getWidth());
			Document document = new Document(landscape, 36, 36, 36, 36);
			PdfWriter writer = PdfWriter.getInstance(document, out);
			document.open();

			boolean first = true;
			for (Page page : model.pages()) {
				if (!first) {
					document.newPage();
				}
				first = false;
				drawPage(writer, document, model, page);
			}

			document.close();
			return out.toByteArray();
		} catch (Exception e) {
			throw new IllegalStateException("Failed to generate certificate PDF", e);
		}
	}

	private void drawPage(PdfWriter writer, Document document, CertificateRenderModel model, Page page)
			throws Exception {
		CertificateTemplate template = model.template() == null ? CertificateTemplate.CLASSIC : model.template();
		switch (template) {
			case MODERN -> drawModern(writer, document, model, page);
			case ELEGANT -> drawElegant(writer, document, model, page);
			default -> drawClassic(writer, document, model, page);
		}
	}

	/** Formal diploma: double gold frame, balanced vertical rhythm, Times name. */
	private void drawClassic(PdfWriter writer, Document document, CertificateRenderModel model, Page page)
			throws Exception {
		PdfContentByte canvas = writer.getDirectContent();
		float w = document.getPageSize().getWidth();
		float h = document.getPageSize().getHeight();
		Color gold = new Color(170, 140, 70);
		Color ink = new Color(28, 42, 58);
		Color muted = new Color(95, 105, 118);

		drawDoubleBorder(canvas, w, h, gold, 22f, 6f);
		drawCornerOrnaments(canvas, w, h, gold, 36f, 14f);

		BaseFont serif = BaseFont.createFont(BaseFont.TIMES_BOLD, BaseFont.WINANSI, BaseFont.NOT_EMBEDDED);
		BaseFont serifReg = BaseFont.createFont(BaseFont.TIMES_ROMAN, BaseFont.WINANSI, BaseFont.NOT_EMBEDDED);
		BaseFont sans = BaseFont.createFont(BaseFont.HELVETICA, BaseFont.WINANSI, BaseFont.NOT_EMBEDDED);
		BaseFont sansBold = BaseFont.createFont(BaseFont.HELVETICA_BOLD, BaseFont.WINANSI, BaseFont.NOT_EMBEDDED);

		float cx = w / 2f;
		float y = h - 50f;
		y = placeLogoBelow(document, model.logoImage(), y, 76, 44, w, 8f);

		if (notBlank(model.organization())) {
			drawCentered(canvas, sansBold, 9, gold, model.organization().toUpperCase(), cx, y);
			y -= 18;
		}

		drawCentered(canvas, sans, 10, muted, model.heading(), cx, y);
		drawRule(canvas, cx - 72, cx + 72, y - 10, gold, 0.9f);
		y -= 36;

		// Body block — even steps so the page doesn't feel top-heavy
		drawCentered(canvas, serifReg, 14, ink, model.certifyLine(), cx, y);
		y -= 36;
		drawCentered(canvas, serif, 34, ink, blankTo(page.recipientName(), "—"), cx, y);
		y -= 26;
		if (notBlank(page.recipientTitle())) {
			drawCentered(canvas, sans, 11, muted, page.recipientTitle(), cx, y);
			y -= 22;
		} else {
			y -= 8;
		}
		drawCentered(canvas, sans, 11, muted, model.participatedLine(), cx, y);
		y -= 24;
		drawCentered(canvas, serif, 18, ink, blankTo(model.eventTitle(), "—"), cx, y);
		y -= 20;
		if (notBlank(model.eventDate())) {
			drawCentered(canvas, sans, 10, muted, model.eventDate(), cx, y);
		}

		drawSigners(canvas, document, model.signers(), ink, muted, sans, sansBold, FOOTER_RESERVE - 8);
		drawVerify(canvas, document, page, muted);
	}

	/** Corporate: left accent rail, top band, left-aligned Helvetica. */
	private void drawModern(PdfWriter writer, Document document, CertificateRenderModel model, Page page)
			throws Exception {
		PdfContentByte canvas = writer.getDirectContent();
		float w = document.getPageSize().getWidth();
		float h = document.getPageSize().getHeight();
		Color teal = new Color(15, 107, 92);
		Color ink = new Color(18, 40, 38);
		Color muted = new Color(80, 105, 100);
		Color soft = new Color(232, 244, 241);

		canvas.setColorFill(soft);
		canvas.rectangle(0, h - 48, w, 48);
		canvas.fill();
		canvas.setColorFill(teal);
		canvas.rectangle(0, 0, 16, h);
		canvas.fill();
		canvas.rectangle(0, 0, w, 8);
		canvas.fill();

		BaseFont sans = BaseFont.createFont(BaseFont.HELVETICA, BaseFont.WINANSI, BaseFont.NOT_EMBEDDED);
		BaseFont sansBold = BaseFont.createFont(BaseFont.HELVETICA_BOLD, BaseFont.WINANSI, BaseFont.NOT_EMBEDDED);

		float left = 52f;
		if (model.logoImage() != null && model.logoImage().length > 0) {
			placeLogoAt(document, model.logoImage(), w - 28 - 64, h - 40, 64, 30, false, w);
		}
		if (notBlank(model.organization())) {
			drawLeft(canvas, sansBold, 10, teal, model.organization().toUpperCase(), left, h - 30);
		}

		float y = h - 78;
		drawLeft(canvas, sans, 10, muted, model.heading(), left, y);
		y -= 32;
		drawLeft(canvas, sans, 13, muted, model.certifyLine(), left, y);
		y -= 40;
		drawLeft(canvas, sansBold, 32, ink, blankTo(page.recipientName(), "—"), left, y);
		y -= 24;
		if (notBlank(page.recipientTitle())) {
			drawLeft(canvas, sans, 11, muted, page.recipientTitle(), left, y);
			y -= 20;
		} else {
			y -= 6;
		}

		canvas.setColorStroke(teal);
		canvas.setLineWidth(2f);
		canvas.moveTo(left, y);
		canvas.lineTo(left + 96, y);
		canvas.stroke();
		y -= 24;

		drawLeft(canvas, sans, 11, muted, model.participatedLine(), left, y);
		y -= 22;
		drawLeft(canvas, sansBold, 16, ink, blankTo(model.eventTitle(), "—"), left, y);
		y -= 18;
		if (notBlank(model.eventDate())) {
			drawLeft(canvas, sans, 10, muted, model.eventDate(), left, y);
		}

		drawSigners(canvas, document, model.signers(), ink, muted, sans, sansBold, FOOTER_RESERVE - 10);
		drawVerify(canvas, document, page, muted);
	}

	/** Premium: cream wash, thin border, ornamental rules, Times display. */
	private void drawElegant(PdfWriter writer, Document document, CertificateRenderModel model, Page page)
			throws Exception {
		PdfContentByte canvas = writer.getDirectContent();
		float w = document.getPageSize().getWidth();
		float h = document.getPageSize().getHeight();
		Color wash = new Color(252, 248, 240);
		Color bronze = new Color(140, 105, 55);
		Color ink = new Color(48, 36, 28);
		Color muted = new Color(115, 95, 75);

		canvas.setColorFill(wash);
		canvas.rectangle(0, 0, w, h);
		canvas.fill();
		canvas.setColorStroke(bronze);
		canvas.setLineWidth(1.1f);
		canvas.rectangle(26, 26, w - 52, h - 52);
		canvas.stroke();

		BaseFont serif = BaseFont.createFont(BaseFont.TIMES_BOLD, BaseFont.WINANSI, BaseFont.NOT_EMBEDDED);
		BaseFont serifItalic = BaseFont.createFont(BaseFont.TIMES_ITALIC, BaseFont.WINANSI, BaseFont.NOT_EMBEDDED);
		BaseFont serifReg = BaseFont.createFont(BaseFont.TIMES_ROMAN, BaseFont.WINANSI, BaseFont.NOT_EMBEDDED);
		BaseFont sans = BaseFont.createFont(BaseFont.HELVETICA, BaseFont.WINANSI, BaseFont.NOT_EMBEDDED);
		BaseFont sansBold = BaseFont.createFont(BaseFont.HELVETICA_BOLD, BaseFont.WINANSI, BaseFont.NOT_EMBEDDED);

		float cx = w / 2f;
		float y = h - 52f;
		y = placeLogoBelow(document, model.logoImage(), y, 68, 42, w, 10f);

		drawCentered(canvas, serif, 18, bronze, model.heading(), cx, y);
		drawOrnamentRule(canvas, cx, y - 16, bronze);
		y -= 36;
		if (notBlank(model.organization())) {
			drawCentered(canvas, serifItalic, 12, muted, model.organization(), cx, y);
			y -= 28;
		} else {
			y -= 10;
		}

		drawCentered(canvas, serifReg, 13, ink, model.certifyLine(), cx, y);
		y -= 36;
		drawCentered(canvas, serif, 36, ink, blankTo(page.recipientName(), "—"), cx, y);
		y -= 26;
		if (notBlank(page.recipientTitle())) {
			drawCentered(canvas, serifItalic, 12, muted, page.recipientTitle(), cx, y);
			y -= 22;
		} else {
			y -= 8;
		}
		drawCentered(canvas, serifReg, 12, muted, model.participatedLine(), cx, y);
		y -= 24;
		drawCentered(canvas, serif, 17, ink, blankTo(model.eventTitle(), "—"), cx, y);
		y -= 20;
		if (notBlank(model.eventDate())) {
			drawCentered(canvas, sans, 10, muted, model.eventDate(), cx, y);
		}

		drawSigners(canvas, document, model.signers(), ink, muted, sans, sansBold, FOOTER_RESERVE - 10);
		drawVerify(canvas, document, page, muted);
	}

	private float placeLogoBelow(
			Document document,
			byte[] logoBytes,
			float topY,
			float maxW,
			float maxH,
			float pageW,
			float gapBelow
	) {
		if (logoBytes == null || logoBytes.length == 0) {
			return topY;
		}
		try {
			Image logo = Image.getInstance(logoBytes);
			logo.scaleToFit(maxW, maxH);
			float bottom = topY - logo.getScaledHeight();
			float px = (pageW - logo.getScaledWidth()) / 2f;
			logo.setAbsolutePosition(px, bottom);
			document.add(logo);
			return bottom - gapBelow;
		} catch (Exception ignored) {
			return topY;
		}
	}

	private void placeLogoAt(
			Document document,
			byte[] logoBytes,
			float x,
			float y,
			float maxW,
			float maxH,
			boolean centerX,
			float pageW
	) {
		if (logoBytes == null || logoBytes.length == 0) {
			return;
		}
		try {
			Image logo = Image.getInstance(logoBytes);
			logo.scaleToFit(maxW, maxH);
			float px = centerX ? (pageW - logo.getScaledWidth()) / 2f : x;
			logo.setAbsolutePosition(px, y);
			document.add(logo);
		} catch (Exception ignored) {
			// skip invalid logo
		}
	}

	private void drawSigners(
			PdfContentByte canvas,
			Document document,
			List<Signer> signers,
			Color ink,
			Color muted,
			BaseFont regular,
			BaseFont bold,
			float baselineY
	) throws Exception {
		if (signers == null || signers.isEmpty()) {
			return;
		}
		// Skip entirely blank signer slots so empty forms don't leave orphan lines
		List<Signer> present = signers.stream()
				.filter(s -> s != null && (notBlank(s.name()) || notBlank(s.title())
						|| (s.signatureImage() != null && s.signatureImage().length > 0)))
				.limit(3)
				.toList();
		if (present.isEmpty()) {
			return;
		}

		float pageW = document.getPageSize().getWidth();
		float lineW = 120f;
		int count = present.size();
		float[] centers = signerCenters(pageW, count);

		for (int i = 0; i < count; i++) {
			Signer signer = present.get(i);
			float cx = centers[i];

			if (signer.signatureImage() != null && signer.signatureImage().length > 0) {
				try {
					Image sig = Image.getInstance(signer.signatureImage());
					sig.scaleToFit(110, 38);
					sig.setAbsolutePosition(cx - sig.getScaledWidth() / 2f, baselineY + 12);
					document.add(sig);
				} catch (Exception ignored) {
					// invalid image — line only
				}
			}

			canvas.setColorStroke(new Color(170, 170, 170));
			canvas.setLineWidth(0.8f);
			canvas.moveTo(cx - lineW / 2f, baselineY);
			canvas.lineTo(cx + lineW / 2f, baselineY);
			canvas.stroke();

			drawCentered(canvas, bold, 10, ink, blankTo(signer.name(), "—"), cx, baselineY - 14);
			if (notBlank(signer.title())) {
				drawCentered(canvas, regular, 8, muted, signer.title(), cx, baselineY - 27);
			}
		}
	}

	private static float[] signerCenters(float pageW, int count) {
		return switch (count) {
			case 1 -> new float[]{pageW / 2f};
			case 2 -> new float[]{pageW * 0.32f, pageW * 0.68f};
			default -> new float[]{pageW * 0.24f, pageW * 0.50f, pageW * 0.76f};
		};
	}

	private void drawVerify(PdfContentByte canvas, Document document, Page page, Color muted) throws Exception {
		BaseFont sans = BaseFont.createFont(BaseFont.HELVETICA, BaseFont.WINANSI, BaseFont.NOT_EMBEDDED);
		float pageW = document.getPageSize().getWidth();

		canvas.beginText();
		canvas.setFontAndSize(sans, 8);
		canvas.setColorFill(muted);
		canvas.setTextMatrix(EDGE, 44);
		canvas.showText("Verify: " + blankTo(page.verifyCode(), "—"));
		canvas.endText();

		// Keep QR clear of corner ornaments (ornaments sit ~y 36–50 near the edge)
		Image qr = Image.getInstance(qrCodeEncoder.encode(page.verifyUrl(), 160), null);
		qr.scaleAbsolute(QR_SIZE, QR_SIZE);
		qr.setAbsolutePosition(pageW - EDGE - QR_SIZE, 44);
		document.add(qr);
	}

	private static void drawDoubleBorder(PdfContentByte canvas, float w, float h, Color color, float inset, float gap) {
		canvas.setColorStroke(color);
		canvas.setLineWidth(2f);
		canvas.rectangle(inset, inset, w - inset * 2, h - inset * 2);
		canvas.stroke();
		canvas.setLineWidth(0.7f);
		float i2 = inset + gap;
		canvas.rectangle(i2, i2, w - i2 * 2, h - i2 * 2);
		canvas.stroke();
	}

	private static void drawCornerOrnaments(PdfContentByte canvas, float w, float h, Color color, float m, float arm) {
		canvas.setColorStroke(color);
		canvas.setLineWidth(1f);
		canvas.moveTo(m, h - m - arm);
		canvas.lineTo(m, h - m);
		canvas.lineTo(m + arm, h - m);
		canvas.moveTo(w - m - arm, h - m);
		canvas.lineTo(w - m, h - m);
		canvas.lineTo(w - m, h - m - arm);
		canvas.moveTo(m, m + arm);
		canvas.lineTo(m, m);
		canvas.lineTo(m + arm, m);
		canvas.moveTo(w - m - arm, m);
		canvas.lineTo(w - m, m);
		canvas.lineTo(w - m, m + arm);
		canvas.stroke();
	}

	private static void drawOrnamentRule(PdfContentByte canvas, float cx, float y, Color color) {
		canvas.setColorStroke(color);
		canvas.setLineWidth(0.85f);
		canvas.moveTo(cx - 88, y);
		canvas.lineTo(cx - 10, y);
		canvas.moveTo(cx + 10, y);
		canvas.lineTo(cx + 88, y);
		canvas.stroke();
		canvas.setColorFill(color);
		float s = 3.5f;
		canvas.moveTo(cx, y + s);
		canvas.lineTo(cx + s, y);
		canvas.lineTo(cx, y - s);
		canvas.lineTo(cx - s, y);
		canvas.fill();
	}

	private static void drawRule(PdfContentByte canvas, float x1, float x2, float y, Color color, float width) {
		canvas.setColorStroke(color);
		canvas.setLineWidth(width);
		canvas.moveTo(x1, y);
		canvas.lineTo(x2, y);
		canvas.stroke();
	}

	private static void drawCentered(PdfContentByte canvas, BaseFont font, float size, Color color, String text, float cx, float y) {
		canvas.beginText();
		canvas.setFontAndSize(font, size);
		canvas.setColorFill(color);
		canvas.showTextAligned(Element.ALIGN_CENTER, text, cx, y, 0);
		canvas.endText();
	}

	private static void drawLeft(PdfContentByte canvas, BaseFont font, float size, Color color, String text, float x, float y) {
		canvas.beginText();
		canvas.setFontAndSize(font, size);
		canvas.setColorFill(color);
		canvas.showTextAligned(Element.ALIGN_LEFT, text, x, y, 0);
		canvas.endText();
	}

	private static boolean notBlank(String value) {
		return value != null && !value.isBlank();
	}

	private static String blankTo(String value, String fallback) {
		return value == null || value.isBlank() ? fallback : value.trim();
	}
}
