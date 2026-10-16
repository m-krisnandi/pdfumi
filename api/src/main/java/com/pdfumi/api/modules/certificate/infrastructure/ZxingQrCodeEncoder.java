package com.pdfumi.api.modules.certificate.infrastructure;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import org.springframework.stereotype.Component;

import java.awt.image.BufferedImage;
import java.util.Map;

@Component
public class ZxingQrCodeEncoder {

	public BufferedImage encode(String content, int size) {
		try {
			QRCodeWriter writer = new QRCodeWriter();
			BitMatrix matrix = writer.encode(
					content,
					BarcodeFormat.QR_CODE,
					size,
					size,
					Map.of(
							EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M,
							EncodeHintType.MARGIN, 1,
							EncodeHintType.CHARACTER_SET, "UTF-8"
					)
			);
			return MatrixToImageWriter.toBufferedImage(matrix);
		} catch (WriterException e) {
			throw new IllegalStateException("Failed to encode QR code", e);
		}
	}
}
