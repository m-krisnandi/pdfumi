package com.pdfumi.api.modules.convert.infrastructure;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import static org.assertj.core.api.Assertions.assertThat;

class PdfBoxImagesToPdfEngineTest {

	@Test
	void recognizesHeicAndHeifUploadsForServerSideDecoding() {
		var heic = new MockMultipartFile("files", "photo.HEIC", "image/heic", new byte[]{1});
		var heif = new MockMultipartFile("files", "photo.heif", "image/heif", new byte[]{1});

		assertThat(PdfBoxImagesToPdfEngine.isImage(heic)).isTrue();
		assertThat(PdfBoxImagesToPdfEngine.isImage(heif)).isTrue();
	}

	@Test
	void rejectsNonImageFilesEvenWhenExtensionLooksSimilar() {
		var text = new MockMultipartFile("files", "photo.txt", "text/plain", "not an image".getBytes());

		assertThat(PdfBoxImagesToPdfEngine.isImage(text)).isFalse();
	}
}
