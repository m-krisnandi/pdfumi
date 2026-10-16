package com.pdfumi.api.modules.convert.infrastructure;

import com.pdfumi.api.modules.convert.application.ImagesToPdfEngine;
import com.pdfumi.api.shared.exception.BadRequestException;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.graphics.image.JPEGFactory;
import org.apache.pdfbox.pdmodel.graphics.image.LosslessFactory;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Component
public class PdfBoxImagesToPdfEngine implements ImagesToPdfEngine {

	private static final Set<String> IMAGE_EXT = Set.of("jpg", "jpeg", "png", "webp", "gif", "bmp");

	@Override
	public byte[] convert(List<MultipartFile> images) {
		try (PDDocument document = new PDDocument()) {
			for (MultipartFile file : images) {
				BufferedImage image = readImage(file);
				float width = image.getWidth();
				float height = image.getHeight();
				if (width < 1 || height < 1) {
					throw new BadRequestException("Gambar tidak valid: " + safeName(file));
				}

				PDPage page = new PDPage(new PDRectangle(width, height));
				document.addPage(page);
				PDImageXObject pdImage = toPdImage(document, file, image);
				try (PDPageContentStream cs = new PDPageContentStream(document, page)) {
					cs.drawImage(pdImage, 0, 0, width, height);
				}
			}
			ByteArrayOutputStream out = new ByteArrayOutputStream();
			document.save(out);
			return out.toByteArray();
		} catch (BadRequestException ex) {
			throw ex;
		} catch (Exception ex) {
			throw new IllegalStateException("Gagal mengonversi gambar ke PDF", ex);
		}
	}

	private static BufferedImage readImage(MultipartFile file) throws Exception {
		byte[] bytes = file.getBytes();
		BufferedImage image = ImageIO.read(new ByteArrayInputStream(bytes));
		if (image == null) {
			throw new BadRequestException("File bukan gambar yang didukung: " + safeName(file));
		}
		return image;
	}

	private static PDImageXObject toPdImage(PDDocument document, MultipartFile file, BufferedImage image)
			throws Exception {
		String name = safeName(file).toLowerCase(Locale.ROOT);
		String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
		boolean jpeg = contentType.contains("jpeg") || contentType.contains("jpg")
				|| name.endsWith(".jpg") || name.endsWith(".jpeg");
		if (jpeg) {
			return JPEGFactory.createFromImage(document, image, 0.92f);
		}
		return LosslessFactory.createFromImage(document, image);
	}

	public static boolean isImage(MultipartFile file) {
		if (file == null || file.isEmpty()) return false;
		String name = safeName(file).toLowerCase(Locale.ROOT);
		int dot = name.lastIndexOf('.');
		if (dot >= 0 && IMAGE_EXT.contains(name.substring(dot + 1))) {
			return true;
		}
		String type = file.getContentType();
		return type != null && type.toLowerCase(Locale.ROOT).startsWith("image/");
	}

	private static String safeName(MultipartFile file) {
		String name = file.getOriginalFilename();
		return name == null || name.isBlank() ? "image" : name;
	}
}
