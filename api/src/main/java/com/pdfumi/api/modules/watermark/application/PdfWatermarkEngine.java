package com.pdfumi.api.modules.watermark.application;

import org.springframework.web.multipart.MultipartFile;

public interface PdfWatermarkEngine {
	byte[] apply(MultipartFile file, String text, float xRatio, float yRatio, float rotationDeg);
}