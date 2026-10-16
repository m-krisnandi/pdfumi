package com.pdfumi.api.modules.convert.application;

import org.springframework.web.multipart.MultipartFile;

public interface OfficeConvertEngine {

	byte[] pdfToDocx(MultipartFile pdf);

	byte[] wordToPdf(MultipartFile word);

	byte[] pdfToXlsx(MultipartFile pdf);

	byte[] excelToPdf(MultipartFile excel);
}
