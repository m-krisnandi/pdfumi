package com.pdfumi.api.billing.application;

import com.pdfumi.api.billing.infrastructure.WebSessionEntity;
import com.pdfumi.api.billing.infrastructure.WebSessionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

@Service
public class WebSessionService {

	public static final String SESSION_HEADER = "X-Session-Token";
	private static final int SESSION_TTL_DAYS = 30;

	private final WebSessionRepository webSessionRepository;
	private final SecureRandom secureRandom = new SecureRandom();

	public WebSessionService(WebSessionRepository webSessionRepository) {
		this.webSessionRepository = webSessionRepository;
	}

	@Transactional
	public String createSession(UUID accountId) {
		Instant now = Instant.now();
		String plaintext = "sess_" + randomHex(32);
		WebSessionEntity entity = new WebSessionEntity(
				UUID.randomUUID(),
				accountId,
				sha256(plaintext),
				now.plus(SESSION_TTL_DAYS, ChronoUnit.DAYS),
				now
		);
		webSessionRepository.save(entity);
		return plaintext;
	}

	@Transactional(readOnly = true)
	public Optional<UUID> resolveAccountId(String rawToken) {
		if (rawToken == null || rawToken.isBlank()) {
			return Optional.empty();
		}
		String hash = sha256(rawToken.trim());
		Optional<WebSessionEntity> found = webSessionRepository.findByTokenHashAndRevokedAtIsNull(hash);
		if (found.isEmpty()) {
			return Optional.empty();
		}
		WebSessionEntity session = found.get();
		if (!session.isActive(Instant.now())) {
			return Optional.empty();
		}
		return Optional.of(session.getAccountId());
	}

	@Transactional
	public boolean revoke(String rawToken) {
		if (rawToken == null || rawToken.isBlank()) {
			return false;
		}
		String hash = sha256(rawToken.trim());
		Optional<WebSessionEntity> found = webSessionRepository.findByTokenHashAndRevokedAtIsNull(hash);
		if (found.isEmpty()) {
			return false;
		}
		WebSessionEntity session = found.get();
		Instant now = Instant.now();
		if (!session.isActive(now)) {
			return false;
		}
		session.revoke(now);
		webSessionRepository.save(session);
		return true;
	}

	private String randomHex(int bytes) {
		byte[] buf = new byte[bytes];
		secureRandom.nextBytes(buf);
		return HexFormat.of().formatHex(buf);
	}

	private static String sha256(String value) {
		try {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
			return HexFormat.of().formatHex(hash);
		} catch (Exception ex) {
			throw new IllegalStateException("Unable to hash session token", ex);
		}
	}
}
