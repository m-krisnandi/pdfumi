package com.pdfumi.api.modules.pdfops.infrastructure;

import com.pdfumi.api.modules.pdfops.application.PdfOpsEngine;
import com.pdfumi.api.shared.exception.BadRequestException;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.cos.COSName;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.PDResources;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.encryption.AccessPermission;
import org.apache.pdfbox.pdmodel.encryption.StandardProtectionPolicy;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.pdmodel.graphics.PDXObject;
import org.apache.pdfbox.pdmodel.graphics.image.JPEGFactory;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.apache.pdfbox.util.Matrix;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Component
public class PdfBoxOpsEngine implements PdfOpsEngine {

	private static final int MAX_PAGES = 500;

	@Override
	public byte[] compress(MultipartFile file) {
		try (PDDocument document = Loader.loadPDF(file.getBytes())) {
			guardPageCount(document);
			recompressImages(document, 0.72f);
			ByteArrayOutputStream out = new ByteArrayOutputStream();
			document.save(out);
			return out.toByteArray();
		} catch (BadRequestException ex) {
			throw ex;
		} catch (Exception ex) {
			throw new IllegalStateException("Gagal mengompres PDF", ex);
		}
	}

	@Override
	public byte[] splitPages(MultipartFile file, List<Integer> pageNumbers1Based) {
		try (PDDocument document = Loader.loadPDF(file.getBytes())) {
			guardPageCount(document);
			List<Integer> pages = pageNumbers1Based == null || pageNumbers1Based.isEmpty()
					? allPageNumbers(document)
					: orderedUnique(pageNumbers1Based);
			if (pages.isEmpty()) {
				throw new BadRequestException("Pilih minimal 1 halaman");
			}
			validatePageList(document, pages);

			ByteArrayOutputStream zipBytes = new ByteArrayOutputStream();
			try (ZipOutputStream zip = new ZipOutputStream(zipBytes)) {
				for (int pageNo : pages) {
					try (PDDocument part = new PDDocument()) {
						part.importPage(document.getPage(pageNo - 1));
						ByteArrayOutputStream pageOut = new ByteArrayOutputStream();
						part.save(pageOut);
						zip.putNextEntry(new ZipEntry(String.format(Locale.ROOT, "page-%03d.pdf", pageNo)));
						zip.write(pageOut.toByteArray());
						zip.closeEntry();
					}
				}
			}
			return zipBytes.toByteArray();
		} catch (BadRequestException ex) {
			throw ex;
		} catch (Exception ex) {
			throw new IllegalStateException("Gagal memisah PDF", ex);
		}
	}

	private static List<Integer> allPageNumbers(PDDocument document) {
		List<Integer> all = new ArrayList<>();
		for (int i = 1; i <= document.getNumberOfPages(); i++) {
			all.add(i);
		}
		return all;
	}

	@Override
	public byte[] rotate(MultipartFile file, int degrees, List<Integer> pageNumbers1Based) {
		int deg = normalizeDegrees(degrees);
		try (PDDocument document = Loader.loadPDF(file.getBytes())) {
			guardPageCount(document);
			Set<Integer> targets = resolvePages(document, pageNumbers1Based, true);
			for (int pageNo : targets) {
				PDPage page = document.getPage(pageNo - 1);
				page.setRotation((page.getRotation() + deg) % 360);
			}
			return save(document);
		} catch (BadRequestException ex) {
			throw ex;
		} catch (Exception ex) {
			throw new IllegalStateException("Gagal memutar PDF", ex);
		}
	}

	@Override
	public byte[] deletePages(MultipartFile file, List<Integer> pageNumbers1Based) {
		try (PDDocument document = Loader.loadPDF(file.getBytes())) {
			guardPageCount(document);
			Set<Integer> toDelete = resolvePages(document, pageNumbers1Based, false);
			if (toDelete.size() >= document.getNumberOfPages()) {
				throw new BadRequestException("Tidak bisa menghapus semua halaman");
			}
			List<Integer> sorted = new ArrayList<>(toDelete);
			sorted.sort((a, b) -> Integer.compare(b, a));
			for (int pageNo : sorted) {
				document.removePage(pageNo - 1);
			}
			return save(document);
		} catch (BadRequestException ex) {
			throw ex;
		} catch (Exception ex) {
			throw new IllegalStateException("Gagal menghapus halaman", ex);
		}
	}

	@Override
	public byte[] extractPages(MultipartFile file, List<Integer> pageNumbers1Based) {
		try (PDDocument source = Loader.loadPDF(file.getBytes());
			 PDDocument out = new PDDocument()) {
			guardPageCount(source);
			List<Integer> pages = (pageNumbers1Based == null || pageNumbers1Based.isEmpty())
					? allPageNumbers(source)
					: orderedUnique(pageNumbers1Based);
			if (pages.isEmpty()) {
				throw new BadRequestException("Pilih minimal 1 halaman");
			}
			validatePageList(source, pages);
			for (int pageNo : pages) {
				out.importPage(source.getPage(pageNo - 1));
			}
			return save(out);
		} catch (BadRequestException ex) {
			throw ex;
		} catch (Exception ex) {
			throw new IllegalStateException("Gagal mengekstrak halaman", ex);
		}
	}

	@Override
	public byte[] organize(MultipartFile file, List<Integer> pageOrder1Based) {
		try (PDDocument source = Loader.loadPDF(file.getBytes());
			 PDDocument out = new PDDocument()) {
			guardPageCount(source);
			List<Integer> order = orderedUnique(pageOrder1Based);
			if (order.isEmpty()) {
				throw new BadRequestException("Urutan halaman diperlukan");
			}
			validatePageList(source, order);
			if (order.size() != source.getNumberOfPages()) {
				throw new BadRequestException("Urutan harus mencakup semua halaman tepat sekali");
			}
			for (int pageNo : order) {
				out.importPage(source.getPage(pageNo - 1));
			}
			return save(out);
		} catch (BadRequestException ex) {
			throw ex;
		} catch (Exception ex) {
			throw new IllegalStateException("Gagal mengatur ulang halaman", ex);
		}
	}

	@Override
	public byte[] protect(MultipartFile file, String userPassword, String ownerPassword) {
		String user = requirePassword(userPassword, "Password diperlukan");
		String owner = (ownerPassword == null || ownerPassword.isBlank()) ? user : ownerPassword.trim();
		try (PDDocument document = Loader.loadPDF(file.getBytes())) {
			guardPageCount(document);
			AccessPermission ap = new AccessPermission();
			StandardProtectionPolicy policy = new StandardProtectionPolicy(owner, user, ap);
			policy.setEncryptionKeyLength(128);
			document.protect(policy);
			return save(document);
		} catch (BadRequestException ex) {
			throw ex;
		} catch (Exception ex) {
			throw new IllegalStateException("Gagal mengunci PDF", ex);
		}
	}

	@Override
	public byte[] unlock(MultipartFile file, String password) {
		String pass = requirePassword(password, "Password diperlukan untuk membuka PDF");
		try (PDDocument document = Loader.loadPDF(file.getBytes(), pass)) {
			guardPageCount(document);
			document.setAllSecurityToBeRemoved(true);
			return save(document);
		} catch (BadRequestException ex) {
			throw ex;
		} catch (IOException ex) {
			throw new BadRequestException("Password salah atau PDF tidak bisa dibuka");
		} catch (Exception ex) {
			throw new IllegalStateException("Gagal membuka PDF", ex);
		}
	}

	@Override
	public byte[] addPageNumbers(MultipartFile file, String position, String format) {
		String pos = position == null || position.isBlank() ? "bottom-center" : position.trim().toLowerCase(Locale.ROOT);
		String fmt = format == null || format.isBlank() ? "n" : format.trim().toLowerCase(Locale.ROOT);
		try (PDDocument document = Loader.loadPDF(file.getBytes())) {
			guardPageCount(document);
			PDType1Font font = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
			int total = document.getNumberOfPages();
			for (int i = 0; i < total; i++) {
				PDPage page = document.getPage(i);
				PDRectangle box = page.getMediaBox();
				String label = "n-of-total".equals(fmt)
						? (i + 1) + " / " + total
						: String.valueOf(i + 1);
				float textWidth = font.getStringWidth(label) / 1000f * 10f;
				float x;
				float y;
				switch (pos) {
					case "bottom-left" -> {
						x = 36f;
						y = 24f;
					}
					case "bottom-right" -> {
						x = box.getWidth() - 36f - textWidth;
						y = 24f;
					}
					case "top-center" -> {
						x = (box.getWidth() - textWidth) / 2f;
						y = box.getHeight() - 28f;
					}
					default -> {
						x = (box.getWidth() - textWidth) / 2f;
						y = 24f;
					}
				}
				try (PDPageContentStream cs = new PDPageContentStream(
						document, page, PDPageContentStream.AppendMode.APPEND, true, true)) {
					cs.beginText();
					cs.setFont(font, 10f);
					cs.setNonStrokingColor(0.25f, 0.25f, 0.25f);
					cs.newLineAtOffset(x, y);
					cs.showText(label);
					cs.endText();
				}
			}
			return save(document);
		} catch (BadRequestException ex) {
			throw ex;
		} catch (Exception ex) {
			throw new IllegalStateException("Gagal menambah nomor halaman", ex);
		}
	}

	@Override
	public byte[] crop(MultipartFile file, float left, float right, float top, float bottom) {
		float l = clampMargin(left);
		float r = clampMargin(right);
		float t = clampMargin(top);
		float b = clampMargin(bottom);
		if (l + r >= 0.9f || t + b >= 0.9f) {
			throw new BadRequestException("Margin terlalu besar");
		}
		try (PDDocument document = Loader.loadPDF(file.getBytes())) {
			guardPageCount(document);
			for (PDPage page : document.getPages()) {
				PDRectangle media = page.getMediaBox();
				float x = media.getLowerLeftX() + media.getWidth() * l;
				float y = media.getLowerLeftY() + media.getHeight() * b;
				float w = media.getWidth() * (1f - l - r);
				float h = media.getHeight() * (1f - t - b);
				PDRectangle crop = new PDRectangle(x, y, w, h);
				page.setCropBox(crop);
			}
			return save(document);
		} catch (BadRequestException ex) {
			throw ex;
		} catch (Exception ex) {
			throw new IllegalStateException("Gagal memotong PDF", ex);
		}
	}

	@Override
	public byte[] sign(
			MultipartFile file,
			MultipartFile signatureImage,
			float x,
			float y,
			float widthRatio,
			int pageNumber
	) {
		if (signatureImage == null || signatureImage.isEmpty()) {
			throw new BadRequestException("Upload gambar tanda tangan");
		}
		float xr = clamp(x, 0.02f, 0.98f);
		float yr = clamp(y, 0.02f, 0.98f);
		float wr = clamp(widthRatio, 0.06f, 0.6f);
		try (PDDocument document = Loader.loadPDF(file.getBytes())) {
			guardPageCount(document);
			PDImageXObject image = PDImageXObject.createFromByteArray(
					document,
					signatureImage.getBytes(),
					"signature"
			);
			int total = document.getNumberOfPages();
			List<Integer> targets = new ArrayList<>();
			if (pageNumber < 0) {
				for (int i = 1; i <= total; i++) targets.add(i);
			} else if (pageNumber == 0) {
				targets.add(total);
			} else {
				if (pageNumber < 1 || pageNumber > total) {
					throw new BadRequestException("Halaman tanda tangan di luar jangkauan");
				}
				targets.add(pageNumber);
			}
			float aspect = image.getHeight() <= 0 ? 0.35f : (float) image.getHeight() / (float) image.getWidth();
			for (int pageNo : targets) {
				PDPage page = document.getPage(pageNo - 1);
				try (PDPageContentStream cs = new PDPageContentStream(
						document, page, PDPageContentStream.AppendMode.APPEND, true, true)) {
					drawImageInVisualSpace(cs, page, image, xr, yr, wr, aspect);
				}
			}
			return save(document);
		} catch (BadRequestException ex) {
			throw ex;
		} catch (Exception ex) {
			throw new IllegalStateException("Gagal menambahkan tanda tangan", ex);
		}
	}

	/**
	 * Places an image using the same top-left normalized coords as the browser preview
	 * (pdf.js), respecting page /Rotate so landscape certificates match the UI.
	 */
	private static void drawImageInVisualSpace(
			PDPageContentStream cs,
			PDPage page,
			PDImageXObject image,
			float xFromLeft,
			float yFromTop,
			float widthRatio,
			float aspect
	) throws IOException {
		PDRectangle box = page.getCropBox() != null ? page.getCropBox() : page.getMediaBox();
		int rotation = ((page.getRotation() % 360) + 360) % 360;
		float mediaW = box.getWidth();
		float mediaH = box.getHeight();
		float visW = (rotation == 90 || rotation == 270) ? mediaH : mediaW;
		float visH = (rotation == 90 || rotation == 270) ? mediaW : mediaH;

		float drawW = visW * widthRatio;
		float drawH = drawW * aspect;
		float drawX = visW * xFromLeft - drawW / 2f;
		float drawY = visH * (1f - yFromTop) - drawH / 2f;

		cs.saveGraphicsState();
		cs.transform(visualSpaceMatrix(box, rotation));
		cs.drawImage(image, drawX, drawY, drawW, drawH);
		cs.restoreGraphicsState();
	}

	/**
	 * Maps content-stream coords to the upright visual page (origin bottom-left, x right, y up).
	 */
	private static Matrix visualSpaceMatrix(PDRectangle box, int rotation) {
		float llx = box.getLowerLeftX();
		float lly = box.getLowerLeftY();
		float w = box.getWidth();
		float h = box.getHeight();
		return switch (rotation) {
			case 90 -> new Matrix(0, 1, -1, 0, llx + w, lly);
			case 180 -> new Matrix(-1, 0, 0, -1, llx + w, lly + h);
			case 270 -> new Matrix(0, -1, 1, 0, llx, lly + w);
			default -> Matrix.getTranslateInstance(llx, lly);
		};
	}

	private static void recompressImages(PDDocument document, float quality) throws Exception {
		for (PDPage page : document.getPages()) {
			PDResources resources = page.getResources();
			if (resources == null) continue;
			for (COSName name : resources.getXObjectNames()) {
				PDXObject xObject = resources.getXObject(name);
				if (!(xObject instanceof PDImageXObject image)) continue;
				if (image.getWidth() * image.getHeight() < 40_000) continue;
				BufferedImage buffered = image.getImage();
				if (buffered == null) continue;
				PDImageXObject jpeg = JPEGFactory.createFromImage(document, buffered, quality);
				resources.put(name, jpeg);
			}
		}
	}

	private static byte[] save(PDDocument document) throws Exception {
		ByteArrayOutputStream out = new ByteArrayOutputStream();
		document.save(out);
		return out.toByteArray();
	}

	private static void guardPageCount(PDDocument document) {
		int pages = document.getNumberOfPages();
		if (pages < 1) {
			throw new BadRequestException("PDF kosong");
		}
		if (pages > MAX_PAGES) {
			throw new BadRequestException("Maksimal " + MAX_PAGES + " halaman");
		}
	}

	private static int normalizeDegrees(int degrees) {
		int d = degrees % 360;
		if (d < 0) d += 360;
		if (d != 0 && d != 90 && d != 180 && d != 270) {
			throw new BadRequestException("Rotasi harus 0, 90, 180, atau 270 derajat");
		}
		return d;
	}

	private static Set<Integer> resolvePages(PDDocument document, List<Integer> pageNumbers1Based, boolean allIfEmpty) {
		if (pageNumbers1Based == null || pageNumbers1Based.isEmpty()) {
			if (!allIfEmpty) {
				throw new BadRequestException("Pilih minimal 1 halaman");
			}
			Set<Integer> all = new HashSet<>();
			for (int i = 1; i <= document.getNumberOfPages(); i++) {
				all.add(i);
			}
			return all;
		}
		List<Integer> pages = orderedUnique(pageNumbers1Based);
		validatePageList(document, pages);
		return new HashSet<>(pages);
	}

	private static List<Integer> orderedUnique(List<Integer> pages) {
		if (pages == null) return List.of();
		List<Integer> out = new ArrayList<>();
		Set<Integer> seen = new HashSet<>();
		for (Integer p : pages) {
			if (p == null) continue;
			if (seen.add(p)) out.add(p);
		}
		return out;
	}

	private static void validatePageList(PDDocument document, List<Integer> pages) {
		int max = document.getNumberOfPages();
		for (int p : pages) {
			if (p < 1 || p > max) {
				throw new BadRequestException("Halaman di luar jangkauan: " + p + " (total " + max + ")");
			}
		}
	}

	private static String requirePassword(String password, String message) {
		if (password == null || password.isBlank()) {
			throw new BadRequestException(message);
		}
		String trimmed = password.trim();
		if (trimmed.length() > 64) {
			throw new BadRequestException("Password maksimal 64 karakter");
		}
		return trimmed;
	}

	private static float clampMargin(float value) {
		if (Float.isNaN(value) || value < 0f) return 0f;
		return Math.min(0.4f, value);
	}

	private static float clamp(float value, float min, float max) {
		return Math.max(min, Math.min(max, value));
	}
}
