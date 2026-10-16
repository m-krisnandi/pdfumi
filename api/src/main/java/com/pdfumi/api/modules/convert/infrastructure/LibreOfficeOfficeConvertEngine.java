package com.pdfumi.api.modules.convert.infrastructure;

import com.pdfumi.api.config.PdfumiProperties;
import com.pdfumi.api.modules.convert.application.OfficeConvertEngine;
import com.pdfumi.api.shared.exception.BadRequestException;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.Locale;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantLock;
import java.util.stream.Stream;

/**
 * Converts PDF ↔ Word via LibreOffice headless ({@code soffice}).
 * Serializes conversions (LibreOffice profile locks) and uses a per-job UserInstallation.
 */
@Component
public class LibreOfficeOfficeConvertEngine implements OfficeConvertEngine {

	private static final String DOCX = "docx";
	private static final String XLSX = "xlsx";
	private static final String PDF = "pdf";

	private final PdfumiProperties properties;
	private final ReentrantLock lock = new ReentrantLock();

	public LibreOfficeOfficeConvertEngine(PdfumiProperties properties) {
		this.properties = properties;
	}

	@Override
	public byte[] pdfToDocx(MultipartFile pdf) {
		return convert(pdf, "source.pdf", DOCX);
	}

	@Override
	public byte[] wordToPdf(MultipartFile word) {
		String name = word.getOriginalFilename() == null ? "source.docx" : word.getOriginalFilename();
		String lower = name.toLowerCase(Locale.ROOT);
		String inputName = lower.endsWith(".doc") && !lower.endsWith(".docx") ? "source.doc" : "source.docx";
		return convert(word, inputName, PDF);
	}

	@Override
	public byte[] pdfToXlsx(MultipartFile pdf) {
		return convert(pdf, "source.pdf", XLSX);
	}

	@Override
	public byte[] excelToPdf(MultipartFile excel) {
		String name = excel.getOriginalFilename() == null ? "source.xlsx" : excel.getOriginalFilename();
		String lower = name.toLowerCase(Locale.ROOT);
		String inputName = lower.endsWith(".xls") && !lower.endsWith(".xlsx") ? "source.xls" : "source.xlsx";
		return convert(excel, inputName, PDF);
	}

	private byte[] convert(MultipartFile file, String inputName, String targetExt) {
		String soffice = resolveSoffice();
		Path work = null;
		lock.lock();
		try {
			work = Files.createTempDirectory("pdfumi-lo-");
			Path inputDir = work.resolve("in");
			Path outputDir = work.resolve("out");
			Path profileDir = work.resolve("profile");
			Files.createDirectories(inputDir);
			Files.createDirectories(outputDir);
			Files.createDirectories(profileDir);

			Path input = inputDir.resolve(inputName);
			try (InputStream in = file.getInputStream()) {
				Files.copy(in, input);
			}

			String profileUri = profileDir.toAbsolutePath().toUri().toString();
			ProcessBuilder pb = new ProcessBuilder(
					soffice,
					"--headless",
					"--nologo",
					"--nofirststartwizard",
					"--norestore",
					"-env:UserInstallation=" + profileUri,
					"--convert-to", targetExt,
					"--outdir", outputDir.toAbsolutePath().toString(),
					input.toAbsolutePath().toString()
			);
			pb.redirectErrorStream(true);
			Process process = pb.start();
			String log = new String(process.getInputStream().readAllBytes());
			int timeout = properties.officeTimeoutSeconds();
			boolean finished = process.waitFor(timeout, TimeUnit.SECONDS);
			if (!finished) {
				process.destroyForcibly();
				throw new IllegalStateException("LibreOffice conversion timed out after " + timeout + "s");
			}
			if (process.exitValue() != 0) {
				throw new IllegalStateException("LibreOffice failed (exit " + process.exitValue() + "): " + trim(log));
			}

			Path output = findOutput(outputDir, targetExt);
			if (output == null) {
				throw new IllegalStateException("LibreOffice produced no ." + targetExt + " output: " + trim(log));
			}
			byte[] bytes = Files.readAllBytes(output);
			if (bytes.length == 0) {
				throw new IllegalStateException("Empty conversion result");
			}
			return bytes;
		} catch (BadRequestException ex) {
			throw ex;
		} catch (InterruptedException ex) {
			Thread.currentThread().interrupt();
			throw new IllegalStateException("Conversion interrupted", ex);
		} catch (IOException ex) {
			throw new IllegalStateException("Conversion I/O error: " + ex.getMessage(), ex);
		} finally {
			lock.unlock();
			if (work != null) {
				deleteRecursive(work);
			}
		}
	}

	private String resolveSoffice() {
		String configured = properties.sofficePath();
		Path configuredPath = Path.of(configured);
		if (configuredPath.isAbsolute() && Files.isExecutable(configuredPath)) {
			return configuredPath.toString();
		}
		Path mac = Path.of("/Applications/LibreOffice.app/Contents/MacOS/soffice");
		if (Files.isExecutable(mac)) {
			return mac.toString();
		}
		Path linux = Path.of("/usr/bin/soffice");
		if (Files.isExecutable(linux)) {
			return linux.toString();
		}
		if ("soffice".equals(configured) || configured.isBlank()) {
			// Rely on PATH — ProcessBuilder will fail clearly if missing
			return "soffice";
		}
		return configured;
	}

	private static Path findOutput(Path outputDir, String ext) throws IOException {
		String suffix = "." + ext.toLowerCase(Locale.ROOT);
		try (Stream<Path> stream = Files.list(outputDir)) {
			return stream
					.filter(p -> p.getFileName().toString().toLowerCase(Locale.ROOT).endsWith(suffix))
					.findFirst()
					.orElse(null);
		}
	}

	private static void deleteRecursive(Path root) {
		try (Stream<Path> walk = Files.walk(root)) {
			walk.sorted(Comparator.reverseOrder()).forEach(p -> {
				try {
					Files.deleteIfExists(p);
				} catch (IOException ignored) {
					/* best-effort cleanup */
				}
			});
		} catch (IOException ignored) {
			/* best-effort cleanup */
		}
	}

	private static String trim(String log) {
		if (log == null) {
			return "";
		}
		String t = log.trim();
		return t.length() > 500 ? t.substring(0, 500) + "…" : t;
	}
}
