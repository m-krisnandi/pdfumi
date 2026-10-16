package com.pdfumi.api.shared.mail;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class LoggingOrSmtpMailer implements TransactionalMailer {

	private static final Logger log = LoggerFactory.getLogger(LoggingOrSmtpMailer.class);

	private final ObjectProvider<JavaMailSender> mailSender;
	private final String fromAddress;

	public LoggingOrSmtpMailer(
			ObjectProvider<JavaMailSender> mailSender,
			@org.springframework.beans.factory.annotation.Value("${pdfumi.mail.from:}") String fromAddress
	) {
		this.mailSender = mailSender;
		this.fromAddress = fromAddress == null ? "" : fromAddress.trim();
	}

	@Override
	public void sendText(String to, String subject, String body) {
		JavaMailSender sender = mailSender.getIfAvailable();
		if (sender != null && !fromAddress.isBlank()) {
			try {
				SimpleMailMessage message = new SimpleMailMessage();
				message.setFrom(fromAddress);
				message.setTo(to);
				message.setSubject(subject);
				message.setText(body);
				sender.send(message);
				log.info("Recovery email sent to {}", to);
				return;
			} catch (Exception ex) {
				log.warn("SMTP send failed for {} — falling back to log: {}", to, ex.getMessage());
			}
		}
		log.info("""
				========== PDFUMI EMAIL (SMTP not configured) ==========
				To: {}
				Subject: {}
				{}
				========================================================
				""", to, subject, body);
	}
}
