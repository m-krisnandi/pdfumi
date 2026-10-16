package com.pdfumi.api.modules.convert.infrastructure;

import com.pdfumi.api.modules.convert.application.PdfToImagesEngine;
import com.pdfumi.api.shared.exception.BadRequestException;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.Locale;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Component
public class PdfBoxPdfToImagesEngine implements PdfToImagesEngine {

	private static final float DPI = 150f;
	private static final int MAX_PAGES = 50;

	@Override
	public byte[] convert(MultipartFile pdf, String format) {
		String fmt = normalizeFormat(format);
		try (PDDocument document = Loader.loadPDF(pdf.getBytes())) {
			int pages = document.getNumberOfPages();
			if (pages < 1) {
				throw new BadRequestException("PDF kosong");
			}
			if (pages > MAX_PAGES) {
				throw new BadRequestException("Maksimal " + MAX_PAGES + " halaman per konversi");
			}

			PDFRenderer renderer = new PDFRenderer(document);
			ByteArrayOutputStream zipBytes = new ByteArrayOutputStream();
			try (ZipOutputStream zip = new ZipOutputStream(zipBytes)) {
				for (int i = 0; i < pages; i++) {
					BufferedImage image = renderer.renderImageWithDPI(i, DPI, ImageType.RGB);
					ByteArrayOutputStream imgOut = new ByteArrayOutputStream();
					if (!ImageIO.write(image, fmt.equals("jpg") ? "jpeg" : fmt, imgOut)) {
						throw new IllegalStateException("Gagal menulis gambar halaman " + (i + 1));
					}
					String entryName = String.format(Locale.ROOT, "page-%03d.%s", i + 1, fmt);
					zip.putNextEntry(new ZipEntry(entryName));
					zip.write(imgOut.toByteArray());
					zip.closeEntry();
				}
			}
			return zipBytes.toByteArray();
		} catch (BadRequestException ex) {
			throw ex;
		} catch (Exception ex) {
			throw new IllegalStateException("Gagal mengonversi PDF ke gambar", ex);
		}
	}

	private static String normalizeFormat(String format) {
		String f = format == null ? "jpg" : format.trim().toLowerCase(Locale.ROOT);
		if ("jpeg".equals(f)) f = "jpg";
		if (!"jpg".equals(f) && !"png".equals(f)) {
			throw new BadRequestException("Format harus jpg atau png");
		}
		return f;
	}
}
