package com.pdfumi.api.shared.exception;

public class QuotaExceededException extends RuntimeException {
	public QuotaExceededException(String message) {
		super(message);
	}
}