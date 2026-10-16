package com.pdfumi.api.shared.mail;

public interface TransactionalMailer {
	void sendText(String to, String subject, String body);
}
