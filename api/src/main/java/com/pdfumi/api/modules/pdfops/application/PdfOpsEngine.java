package com.pdfumi.api.modules.pdfops.application;

import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface PdfOpsEngine {
	byte[] compress(MultipartFile file);

	/** ZIP of one PDF per selected page (1-based). Empty list = all pages. */
	byte[] splitPages(MultipartFile file, List<Integer> pageNumbers1Based);

	byte[] rotate(MultipartFile file, int degrees, List<Integer> pageNumbers1Based);

	byte[] deletePages(MultipartFile file, List<Integer> pageNumbers1Based);

	byte[] extractPages(MultipartFile file, List<Integer> pageNumbers1Based);

	/** Rebuild PDF in the given 1-based page order. */
	byte[] organize(MultipartFile file, List<Integer> pageOrder1Based);

	byte[] protect(MultipartFile file, String userPassword, String ownerPassword);

	byte[] unlock(MultipartFile file, String password);

	/**
	 * @param position bottom-center | bottom-right | bottom-left | top-center
	 * @param format   n | n-of-total
	 */
	byte[] addPageNumbers(MultipartFile file, String position, String format);

	/** Crop margins as ratios of page size (0–0.4 each). */
	byte[] crop(MultipartFile file, float left, float right, float top, float bottom);

	/**
	 * Stamp a signature image. pageNumber 0 = last page only; negative = all pages.
	 * x/y are ratios (0–1); widthRatio is signature width relative to page width.
	 */
	byte[] sign(
			MultipartFile file,
			MultipartFile signatureImage,
			float x,
			float y,
			float widthRatio,
			int pageNumber
	);
}
