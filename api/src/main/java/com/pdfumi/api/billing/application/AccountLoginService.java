package com.pdfumi.api.billing.application;

import com.pdfumi.api.billing.infrastructure.AccountEntity;
import com.pdfumi.api.billing.infrastructure.AccountRepository;
import com.pdfumi.api.billing.infrastructure.LoginTokenEntity;
import com.pdfumi.api.billing.infrastructure.LoginTokenRepository;
import com.pdfumi.api.config.PdfumiProperties;
import com.pdfumi.api.shared.exception.BadRequestException;
import com.pdfumi.api.shared.mail.TransactionalMailer;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class AccountLoginService {

	private static final int TOKEN_TTL_MINUTES = 30;
	private static final int MAX_REQUESTS_PER_HOUR = 5;

	private final AccountRepository accountRepository;
	private final LoginTokenRepository loginTokenRepository;
	private final WebSessionService webSessionService;
	private final TransactionalMailer mailer;
	private final PdfumiProperties properties;
	private final SecureRandom secureRandom = new SecureRandom();

	public AccountLoginService(
			AccountRepository accountRepository,
			LoginTokenRepository loginTokenRepository,
			WebSessionService webSessionService,
			TransactionalMailer mailer,
			PdfumiProperties properties
	) {
		this.accountRepository = accountRepository;
		this.loginTokenRepository = loginTokenRepository;
		this.webSessionService = webSessionService;
		this.mailer = mailer;
		this.properties = properties;
	}

	/**
	 * Always returns a generic OK payload (does not reveal whether the email exists).
	 */
	@Transactional
	public Map<String, Object> requestLogin(String rawEmail, String locale) {
		String email = normalizeEmail(rawEmail);
		String safeLocale = normalizeLocale(locale);
		Map<String, Object> response = new HashMap<>();
		response.put(
				"message",
				"If an account exists for that email, a sign-in link was sent. It expires in "
						+ TOKEN_TTL_MINUTES + " minutes."
		);

		accountRepository.findByEmailIgnoreCase(email).ifPresent(account -> {
			Instant hourAgo = Instant.now().minus(1, ChronoUnit.HOURS);
			long recent = loginTokenRepository.countByAccountIdAndCreatedAtAfter(account.getId(), hourAgo);
			if (recent >= MAX_REQUESTS_PER_HOUR) {
				return;
			}

			String token = randomToken();
			Instant now = Instant.now();
			LoginTokenEntity entity = new LoginTokenEntity(
					UUID.randomUUID(),
					account.getId(),
					sha256(token),
					safeLocale,
					now.plus(TOKEN_TTL_MINUTES, ChronoUnit.MINUTES),
					now
			);
			loginTokenRepository.save(entity);

			String link = properties.loginLink(safeLocale, token);
			mailer.sendText(
					account.getEmail(),
					"Pdfumi — sign in",
					"""
							Hi,

							Use this link to sign in to Pdfumi (expires in %d minutes):

							%s

							If you did not request this, you can ignore this email.
							Your API keys are not changed by signing in.

							— Pdfumi
							""".formatted(TOKEN_TTL_MINUTES, link)
			);

			if (properties.exposeDevRecoveryLink()) {
				response.put("devMagicLink", link);
			}
		});

		return response;
	}

	@Transactional
	public Map<String, Object> confirmLogin(String rawToken) {
		if (rawToken == null || rawToken.isBlank()) {
			throw new BadRequestException("Sign-in token is required");
		}
		String hash = sha256(rawToken.trim());
		LoginTokenEntity token = loginTokenRepository.findByTokenHashAndUsedAtIsNull(hash)
				.orElseThrow(() -> new BadRequestException("Invalid or expired sign-in link"));
		Instant now = Instant.now();
		if (!token.isUsable(now)) {
			throw new BadRequestException("Invalid or expired sign-in link");
		}

		AccountEntity account = accountRepository.findById(token.getAccountId())
				.orElseThrow(() -> new BadRequestException("Invalid or expired sign-in link"));

		token.markUsed(now);
		loginTokenRepository.save(token);

		String sessionToken = webSessionService.createSession(account.getId());
		return Map.of(
				"email", account.getEmail(),
				"plan", account.getPlan().name(),
				"sessionToken", sessionToken,
				"hint", "You are signed in. Session lasts 30 days in this browser."
		);
	}

	@Transactional
	public Map<String, Object> logout(String rawSessionToken) {
		boolean revoked = webSessionService.revoke(rawSessionToken);
		return Map.of(
				"ok", true,
				"revoked", revoked
		);
	}

	private static String normalizeEmail(String raw) {
		if (raw == null || raw.isBlank() || !raw.contains("@")) {
			throw new BadRequestException("Valid email is required");
		}
		return raw.trim().toLowerCase(Locale.ROOT);
	}

	private static String normalizeLocale(String locale) {
		if (locale == null || locale.isBlank()) {
			return "en";
		}
		String value = locale.trim().toLowerCase(Locale.ROOT);
		return switch (value) {
			case "id", "ja", "my", "en" -> value;
			default -> "en";
		};
	}

	private String randomToken() {
		byte[] buf = new byte[32];
		secureRandom.nextBytes(buf);
		return HexFormat.of().formatHex(buf);
	}

	private static String sha256(String value) {
		try {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
			return HexFormat.of().formatHex(hash);
		} catch (Exception ex) {
			throw new IllegalStateException("Unable to hash login token", ex);
		}
	}
}
