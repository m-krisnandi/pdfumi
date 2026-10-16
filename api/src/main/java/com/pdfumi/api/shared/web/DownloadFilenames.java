package com.pdfumi.api.shared.web;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Locale;

/**
 * Keep download filenames matching the user's original upload so they don't rename later.
 */
public final class DownloadFilenames {

	private DownloadFilenames() {
	}

	public static String fromUpload(MultipartFile file, String fallback, String forceExt) {
		String original = file == null ? null : file.getOriginalFilename();
		return normalize(original, fallback, forceExt);
	}

	public static String fromUploads(List<MultipartFile> files, String fallback, String forceExt) {
		if (files == null || files.isEmpty()) {
			return normalize(null, fallback, forceExt);
		}
		return fromUpload(files.getFirst(), fallback, forceExt);
	}

	public static String normalize(String original, String fallback, String forceExt) {
		String name = original == null || original.isBlank() ? fallback : original.trim();
		name = name.replace('\\', '/');
		int slash = name.lastIndexOf('/');
		if (slash >= 0) {
			name = name.substring(slash + 1);
		}
		name = name.replaceAll("[\\r\\n\"\\\\]", "_");
		if (name.isBlank()) {
			name = fallback;
		}
		if (forceExt != null && !forceExt.isBlank()) {
			String ext = forceExt.startsWith(".") ? forceExt : "." + forceExt;
			int dot = name.lastIndexOf('.');
			if (dot > 0) {
				name = name.substring(0, dot) + ext.toLowerCase(Locale.ROOT);
			} else {
				name = name + ext.toLowerCase(Locale.ROOT);
			}
		}
		return name;
	}

	public static ResponseEntity<byte[]> pdfAttachment(byte[] body, String filename) {
		return attachment(body, filename, MediaType.APPLICATION_PDF);
	}

	public static ResponseEntity<byte[]> zipAttachment(byte[] body, String filename) {
		return attachment(body, filename, MediaType.parseMediaType("application/zip"));
	}

	public static ResponseEntity<byte[]> attachment(byte[] body, String filename, MediaType mediaType) {
		ContentDisposition disposition = ContentDisposition.attachment()
				.filename(filename, StandardCharsets.UTF_8)
				.build();
		return ResponseEntity.ok()
				.header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
				.contentType(mediaType)
				.body(body);
	}
}
