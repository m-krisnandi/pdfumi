package com.pdfumi.api.modules.convert.infrastructure;

import com.pdfumi.api.config.PdfumiProperties;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.Loader;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;

import static org.assertj.core.api.Assertions.assertThat;

class LibreOfficeOfficeConvertEngineTest {

	@Test
	void pdfToDocxPreservesEveryPageAsHighResolutionVisualPage() throws Exception {
		var engine = new LibreOfficeOfficeConvertEngine(properties());
		var input = new MockMultipartFile("file", "visual-sample.pdf", "application/pdf", visualPdf());

		byte[] result = engine.pdfToDocx(input);

		try (XWPFDocument document = new XWPFDocument(new ByteArrayInputStream(result))) {
			assertThat(document.getAllPictures()).hasSize(2);
			assertThat(document.getAllPictures())
					.allSatisfy(picture -> {
						assertThat(picture.getPictureType()).isEqualTo(XWPFDocument.PICTURE_TYPE_PNG);
						assertThat(picture.getData()).hasSizeGreaterThan(1_000);
					});
			assertThat(document.getDocument().getBody().getSectPr().getPgSz().getW()).isNotNull();
		}

		byte[] roundTrippedPdf = engine.wordToPdf(new MockMultipartFile(
				"file",
				"visual-sample.docx",
				"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
				result
		));
		try (PDDocument roundTripped = Loader.loadPDF(roundTrippedPdf)) {
			assertThat(roundTripped.getNumberOfPages()).isEqualTo(2);
		}
	}

	@Test
	void pdfToXlsxCreatesReadableSpreadsheet() throws Exception {
		var engine = new LibreOfficeOfficeConvertEngine(properties());
		var input = new MockMultipartFile("file", "sample.pdf", "application/pdf", samplePdf());

		byte[] result = engine.pdfToXlsx(input);

		try (XSSFWorkbook workbook = new XSSFWorkbook(new ByteArrayInputStream(result))) {
			assertThat(workbook.getSheet("PDF").getRow(0).getCell(0).getStringCellValue())
					.contains("Pdfumi conversion test");
		}
	}

	@Test
	void wordToPdfExportsValidPdf() throws Exception {
		var engine = new LibreOfficeOfficeConvertEngine(properties());
		byte[] wordBytes;
		try (XWPFDocument document = new XWPFDocument(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
			document.createParagraph().createRun().setText("Word to PDF test");
			document.write(out);
			wordBytes = out.toByteArray();
		}

		var input = new MockMultipartFile(
				"file", "sample.docx",
				"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
				wordBytes
		);

		byte[] result = engine.wordToPdf(input);

		assertThat(result).startsWith((byte) '%', (byte) 'P', (byte) 'D', (byte) 'F');
	}

	private static PdfumiProperties properties() {
		return new PdfumiProperties(
				"http://localhost:3000",
				"footer",
				"http://localhost:3000",
				"http://localhost:8080",
				24,
				new PdfumiProperties.Free(5, 20),
				new PdfumiProperties.Security("actuator", "secret", true),
				null,
				null,
				new PdfumiProperties.Office("/usr/bin/soffice", 30)
		);
	}

	private static byte[] samplePdf() throws Exception {
		try (PDDocument document = new PDDocument()) {
			PDPage page = new PDPage(PDRectangle.A4);
			document.addPage(page);
			try (PDPageContentStream content = new PDPageContentStream(document, page)) {
				content.beginText();
				content.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 14);
				content.newLineAtOffset(72, 760);
				content.showText("Pdfumi conversion test");
				content.endText();
			}
			ByteArrayOutputStream out = new ByteArrayOutputStream();
			document.save(out);
			return out.toByteArray();
		}
	}

	private static byte[] visualPdf() throws Exception {
		try (PDDocument document = new PDDocument()) {
			for (int pageNumber = 0; pageNumber < 2; pageNumber++) {
				PDPage page = new PDPage(PDRectangle.A4);
				document.addPage(page);
				try (PDPageContentStream content = new PDPageContentStream(document, page)) {
					content.setStrokingColor(0.1f, 0.4f, 0.7f);
					content.setNonStrokingColor(0.85f, 0.92f, 1f);
					content.addRect(72, 620, 468, 90);
					content.fillAndStroke();
					content.setStrokingColor(0.2f, 0.2f, 0.2f);
					for (int row = 0; row < 3; row++) {
						content.moveTo(72, 500 - row * 36);
						content.lineTo(540, 500 - row * 36);
					}
					for (int column = 0; column < 3; column++) {
						content.moveTo(72 + column * 156, 500);
						content.lineTo(72 + column * 156, 428);
					}
					content.stroke();
					content.beginText();
					content.setNonStrokingColor(0f, 0f, 0f);
					content.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 18);
					content.newLineAtOffset(90, 665);
					content.showText("Pdfumi visual fidelity page " + (pageNumber + 1));
					content.endText();
				}
			}
			ByteArrayOutputStream out = new ByteArrayOutputStream();
			document.save(out);
			return out.toByteArray();
		}
	}
}
