package com.pdfumi.api.modules.convert.application;

import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ImagesToPdfEngine {
	byte[] convert(List<MultipartFile> images);
}
