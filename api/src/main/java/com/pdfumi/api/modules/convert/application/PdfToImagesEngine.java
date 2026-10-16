package com.pdfumi.api.modules.convert.application;

import org.springframework.web.multipart.MultipartFile;

public interface PdfToImagesEngine {
	/** ZIP of image files (one per page). */
	byte[] convert(MultipartFile pdf, String format);
}
