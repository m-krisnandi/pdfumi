package com.pdfumi.api.modules.merge.application;

import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface PdfMergeEngine {
	byte[] merge(List<MultipartFile> files);
}