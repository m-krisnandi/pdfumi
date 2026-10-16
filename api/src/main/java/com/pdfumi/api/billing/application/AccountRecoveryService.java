package com.pdfumi.api.billing.application;

import com.pdfumi.api.billing.infrastructure.AccountEntity;
import com.pdfumi.api.billing.infrastructure.AccountRepository;
import com.pdfumi.api.billing.infrastructure.ApiKeyEntity;
import com.pdfumi.api.billing.infrastructure.ApiKeyRepository;
import com.pdfumi.api.billing.infrastructure.RecoveryTokenEntity;
import com.pdfumi.api.billing.infrastructure.RecoveryTokenRepository;
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
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class AccountRecoveryService {

	private static final int TOKEN_TTL_MINUTES = 30;
	private static final int MAX_REQUESTS_PER_HOUR = 5;

	private final AccountRepository accountRepository;
	private final ApiKeyRepository apiKeyRepository;
	private final RecoveryTokenRepository recoveryTokenRepository;
	private final WebSessionService webSessionService;
	private final TransactionalMailer mailer;
	private final PdfumiProperties properties;
	private final SecureRandom secureRandom = new SecureRandom();

	public AccountRecoveryService(
			AccountRepository accountRepository,
			ApiKeyRepository apiKeyRepository,
			RecoveryTokenRepository recoveryTokenRepository,
			WebSessionService webSessionService,
			TransactionalMailer mailer,
			PdfumiProperties properties
	) {
		this.accountRepository = accountRepository;
		this.apiKeyRepository = apiKeyRepository;
		this.recoveryTokenRepository = recoveryTokenRepository;
		this.webSessionService = webSessionService;
		this.mailer = mailer;
		this.properties = properties;
	}

	/**
	 * Always returns a generic OK payload (does not reveal whether the email exists).
	 */
	@Transactional
	public Map<String, Object> requestRecovery(String rawEmail, String locale) {
		String email = normalizeEmail(rawEmail);
		String safeLocale = normalizeLocale(locale);
		Map<String, Object> response = new HashMap<>();
		response.put(
				"message",
				"If an account exists for that email, a recovery link was sent. It expires in "
						+ TOKEN_TTL_MINUTES + " minutes."
		);

		accountRepository.findByEmailIgnoreCase(email).ifPresent(account -> {
			Instant hourAgo = Instant.now().minus(1, ChronoUnit.HOURS);
			long recent = recoveryTokenRepository.countByAccountIdAndCreatedAtAfter(account.getId(), hourAgo);
			if (recent >= MAX_REQUESTS_PER_HOUR) {
				return;
			}

			String token = randomToken();
			Instant now = Instant.now();
			RecoveryTokenEntity entity = new RecoveryTokenEntity(
					UUID.randomUUID(),
					account.getId(),
					sha256(token),
					safeLocale,
					now.plus(TOKEN_TTL_MINUTES, ChronoUnit.MINUTES),
					now
			);
			recoveryTokenRepository.save(entity);

			String link = properties.recoveryLink(safeLocale, token);
			mailer.sendText(
					account.getEmail(),
					"Pdfumi — recover your API key",
					"""
							Hi,

							Use this link to create a new Pdfumi API key (expires in %d minutes):

							%s

							If you did not request this, you can ignore this email.
							Your existing keys stay valid until you open the link and confirm recovery.

							— Pdfumi
							""".formatted(TOKEN_TTL_MINUTES, link)
			);

			if (properties.exposeDevRecoveryLink()) {
				response.put("devMagicLink", link);
			}
		});

		return response;
	}

	/**
	 * Consumes the magic link: revokes all active keys and issues one new key.
	 */
	@Transactional
	public Map<String, Object> confirmRecovery(String rawToken) {
		if (rawToken == null || rawToken.isBlank()) {
			throw new BadRequestException("Recovery token is required");
		}
		String hash = sha256(rawToken.trim());
		RecoveryTokenEntity token = recoveryTokenRepository.findByTokenHashAndUsedAtIsNull(hash)
				.orElseThrow(() -> new BadRequestException("Invalid or expired recovery link"));
		Instant now = Instant.now();
		if (!token.isUsable(now)) {
			throw new BadRequestException("Invalid or expired recovery link");
		}

		AccountEntity account = accountRepository.findById(token.getAccountId())
				.orElseThrow(() -> new BadRequestException("Invalid or expired recovery link"));

		List<ApiKeyEntity> active = apiKeyRepository
				.findByAccountIdAndRevokedAtIsNullOrderByCreatedAtDesc(account.getId());
		for (ApiKeyEntity key : active) {
			key.revoke();
			apiKeyRepository.save(key);
		}

		String secret = randomToken().substring(0, 48);
		String plaintext = "pdfumi_" + secret;
		String prefix = "pdfumi_" + secret.substring(0, 8);
		ApiKeyEntity created = new ApiKeyEntity(
				UUID.randomUUID(),
				account.getId(),
				prefix,
				sha256(plaintext),
				"Recovered",
				now
		);
		apiKeyRepository.save(created);
		token.markUsed(now);
		recoveryTokenRepository.save(token);

		String sessionToken = webSessionService.createSession(account.getId());
		return Map.of(
				"email", account.getEmail(),
				"plan", account.getPlan().name(),
				"apiKey", plaintext,
				"apiKeyPrefix", prefix,
				"sessionToken", sessionToken,
				"revokedPreviousKeys", active.size(),
				"hint", "Store this API key now — it is shown only once. Previous keys were revoked. You are signed in for 30 days."
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
			throw new IllegalStateException("Unable to hash recovery token", ex);
		}
	}
}
