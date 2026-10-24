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
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.TimeUnit;

@Component
public class PdfBoxImagesToPdfEngine implements ImagesToPdfEngine {

	private static final Set<String> IMAGE_EXT = Set.of("jpg", "jpeg", "png", "webp", "gif", "bmp", "heic", "heif");

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
		if (image == null && isHeic(file)) {
			image = decodeHeicWithImageMagick(bytes, safeName(file));
		}
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

	private static boolean isHeic(MultipartFile file) {
		String name = safeName(file).toLowerCase(Locale.ROOT);
		return name.endsWith(".heic") || name.endsWith(".heif");
	}

	private static BufferedImage decodeHeicWithImageMagick(byte[] bytes, String originalName) throws Exception {
		Path input = Files.createTempFile("pdfumi-heic-", extensionOf(originalName));
		Path errorLog = Files.createTempFile("pdfumi-heic-", ".log");
		try {
			Files.write(input, bytes);
			ProcessBuilder builder = new ProcessBuilder(
					resolveImageMagick(),
					input.toAbsolutePath().toString(),
					"-auto-orient",
					"png:-"
			);
			builder.redirectError(errorLog.toFile());
			Process process = builder.start();
			byte[] png = process.getInputStream().readAllBytes();
			if (!process.waitFor(30, TimeUnit.SECONDS)) {
				process.destroyForcibly();
				throw new IllegalStateException("Konversi HEIC melebihi batas waktu");
			}
			if (process.exitValue() != 0) {
				throw new IllegalStateException("ImageMagick gagal membaca HEIC: " + trimLog(Files.readAllBytes(errorLog)));
			}
			BufferedImage image = ImageIO.read(new ByteArrayInputStream(png));
			if (image == null) {
				throw new BadRequestException("HEIC tidak dapat dibaca di server");
			}
			return image;
		} catch (IOException ex) {
			throw new IllegalStateException("Dukungan HEIC belum tersedia di server", ex);
		} finally {
			Files.deleteIfExists(input);
			Files.deleteIfExists(errorLog);
		}
	}

	private static String resolveImageMagick() {
		if (Files.isExecutable(Path.of("/usr/bin/magick"))) return "/usr/bin/magick";
		if (Files.isExecutable(Path.of("/usr/bin/convert"))) return "/usr/bin/convert";
		return "convert";
	}

	private static String extensionOf(String name) {
		String lower = name.toLowerCase(Locale.ROOT);
		return lower.endsWith(".heif") ? ".heif" : ".heic";
	}

	private static String trimLog(byte[] bytes) {
		String log = new String(bytes).trim();
		return log.length() > 400 ? log.substring(0, 400) + "…" : log;
	}
}
