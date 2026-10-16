package com.pdfumi.api.billing.application;

import com.pdfumi.api.billing.domain.Plan;
import com.pdfumi.api.billing.domain.PlanEntitlements;
import com.pdfumi.api.billing.infrastructure.AccountEntity;
import com.pdfumi.api.billing.infrastructure.AccountRepository;
import com.pdfumi.api.billing.infrastructure.ApiKeyEntity;
import com.pdfumi.api.billing.infrastructure.ApiKeyRepository;
import com.pdfumi.api.billing.infrastructure.PricingPlanRepository;
import com.pdfumi.api.shared.exception.BadRequestException;
import com.pdfumi.api.shared.exception.NotFoundException;
import com.pdfumi.api.shared.web.ClientKeyResolver;
import jakarta.servlet.http.HttpServletRequest;
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
public class AccountService {

	public static final String API_KEY_HEADER = "X-Api-Key";
	private static final String KEY_PREFIX = "pdfumi_";

	private final AccountRepository accountRepository;
	private final ApiKeyRepository apiKeyRepository;
	private final PricingPlanRepository pricingPlanRepository;
	private final ClientKeyResolver clientKeyResolver;
	private final WebSessionService webSessionService;
	private final SecureRandom secureRandom = new SecureRandom();

	public AccountService(
			AccountRepository accountRepository,
			ApiKeyRepository apiKeyRepository,
			PricingPlanRepository pricingPlanRepository,
			ClientKeyResolver clientKeyResolver,
			WebSessionService webSessionService
	) {
		this.accountRepository = accountRepository;
		this.apiKeyRepository = apiKeyRepository;
		this.pricingPlanRepository = pricingPlanRepository;
		this.clientKeyResolver = clientKeyResolver;
		this.webSessionService = webSessionService;
	}

	@Transactional(readOnly = true)
	public ClientContext resolve(HttpServletRequest request) {
		String rawKey = request.getHeader(API_KEY_HEADER);
		if (rawKey != null && !rawKey.isBlank()) {
			String hash = sha256(rawKey.trim());
			ApiKeyEntity key = apiKeyRepository.findByKeyHashAndRevokedAtIsNull(hash)
					.orElseThrow(() -> new BadRequestException("Invalid API key"));
			AccountEntity account = accountRepository.findById(key.getAccountId())
					.orElseThrow(() -> new NotFoundException("Account not found"));
			Plan plan = effectivePlan(account);
			return ClientContext.forAccount(account.getId(), account.getEmail(), plan, entitlementsFor(plan));
		}

		String sessionToken = request.getHeader(WebSessionService.SESSION_HEADER);
		if (sessionToken != null && !sessionToken.isBlank()) {
			var accountId = webSessionService.resolveAccountId(sessionToken);
			if (accountId.isPresent()) {
				AccountEntity account = accountRepository.findById(accountId.get())
						.orElseThrow(() -> new NotFoundException("Account not found"));
				Plan plan = effectivePlan(account);
				return ClientContext.forAccount(account.getId(), account.getEmail(), plan, entitlementsFor(plan));
			}
		}

		String clientIp = clientKeyResolver.resolve(request);
		return ClientContext.anonymous(clientIp);
	}

	@Transactional
	public Map<String, Object> register(String rawEmail) {
		String email = normalizeEmail(rawEmail);
		if (accountRepository.findByEmailIgnoreCase(email).isPresent()) {
			throw new BadRequestException("Account with this email already exists");
		}
		Instant now = Instant.now();
		AccountEntity account = new AccountEntity(UUID.randomUUID(), email, Plan.FREE, now);
		accountRepository.save(account);

		CreatedKey key = createApiKey(account.getId(), "Default");

		return Map.of(
				"accountId", account.getId().toString(),
				"email", account.getEmail(),
				"plan", account.getPlan().name(),
				"apiKey", key.plaintext(),
				"keyPrefix", key.entity().getKeyPrefix()
		);
	}

	@Transactional
	public Map<String, Object> loginWithGoogle(String rawEmail) {
		String email = normalizeEmail(rawEmail);
		AccountEntity account = accountRepository.findByEmailIgnoreCase(email).orElseGet(() -> {
			Instant now = Instant.now();
			AccountEntity created = new AccountEntity(UUID.randomUUID(), email, Plan.FREE, now);
			accountRepository.save(created);
			createApiKey(created.getId(), "Default");
			return created;
		});

		String sessionToken = webSessionService.createSession(account.getId());
		return Map.of(
				"accountId", account.getId().toString(),
				"email", account.getEmail(),
				"plan", effectivePlan(account).name(),
				"sessionToken", sessionToken
		);
	}

	@Transactional(readOnly = true)
	public Map<String, Object> me(ClientContext client) {
		if (client.accountId() == null) {
			return Map.of(
					"authenticated", false,
					"plan", Plan.FREE.name(),
					"entitlements", client.entitlements()
			);
		}
		AccountEntity account = accountRepository.findById(client.accountId())
				.orElseThrow(() -> new NotFoundException("Account not found"));
		List<ApiKeyEntity> keys = apiKeyRepository.findByAccountIdAndRevokedAtIsNullOrderByCreatedAtDesc(account.getId());

		List<Map<String, Object>> keyList = keys.stream()
				.map(k -> Map.<String, Object>of(
						"id", k.getId().toString(),
						"prefix", k.getKeyPrefix(),
						"label", k.getLabel() == null ? "" : k.getLabel(),
						"createdAt", k.getCreatedAt().toString()
				))
				.toList();

		Map<String, Object> map = new java.util.HashMap<>();
		map.put("authenticated", true);
		map.put("accountId", account.getId().toString());
		map.put("email", account.getEmail());
		map.put("plan", effectivePlan(account).name());
		map.put("subscriptionStatus", account.getSubscriptionStatus() == null ? "inactive" : account.getSubscriptionStatus());
		map.put("currentPeriodEnd", account.getCurrentPeriodEnd() == null ? null : account.getCurrentPeriodEnd().toString());
		map.put("keys", keyList);
		map.put("entitlements", client.entitlements());
		return map;
	}

	@Transactional
	public Map<String, Object> createAdditionalKey(ClientContext client, String label) {
		if (client.accountId() == null) {
			throw new BadRequestException("Only registered accounts can create API keys");
		}
		long currentCount = apiKeyRepository.countByAccountIdAndRevokedAtIsNull(client.accountId());
		int max = client.entitlements().maxApiKeys();
		if (currentCount >= max) {
			throw new BadRequestException("Plan limit reached (" + max + " key max for " + client.plan() + ")");
		}
		CreatedKey key = createApiKey(client.accountId(), (label == null || label.isBlank()) ? "Key #" + (currentCount + 1) : label.trim());
		return Map.of(
				"id", key.entity().getId().toString(),
				"apiKey", key.plaintext(),
				"prefix", key.entity().getKeyPrefix(),
				"label", key.entity().getLabel() == null ? "" : key.entity().getLabel(),
				"createdAt", key.entity().getCreatedAt().toString()
		);
	}

	@Transactional
	public EnsureAccount ensureAccount(String rawEmail) {
		String email = normalizeEmail(rawEmail);
		return accountRepository.findByEmailIgnoreCase(email)
				.map(acc -> new EnsureAccount(acc, null))
				.orElseGet(() -> {
					AccountEntity created = new AccountEntity(UUID.randomUUID(), email, Plan.FREE, Instant.now());
					accountRepository.save(created);
					CreatedKey key = createApiKey(created.getId(), "Default");
					return new EnsureAccount(created, key.plaintext());
				});
	}

	@Transactional
	public AccountEntity requireByEmail(String rawEmail) {
		return ensureAccount(rawEmail).account();
	}

	@Transactional(readOnly = true)
	public AccountEntity requireAccount(UUID id) {
		return accountRepository.findById(id).orElseThrow(() -> new NotFoundException("Account not found"));
	}

	public AccountRepository accounts() {
		return accountRepository;
	}

	@Transactional
	public Map<String, Object> provisionAccount(String rawEmail, Plan plan, Integer days, boolean lifetime) {
		String email = normalizeEmail(rawEmail);
		AccountEntity account = accountRepository.findByEmailIgnoreCase(email)
				.orElseGet(() -> {
					AccountEntity fresh = new AccountEntity(UUID.randomUUID(), email, Plan.FREE, Instant.now());
					return accountRepository.save(fresh);
				});

		account.setPlan(plan);
		Instant now = Instant.now();
		if (lifetime) {
			account.setSubscriptionStatus("lifetime");
			account.setCurrentPeriodEnd(now.plus(36500, ChronoUnit.DAYS)); // 100 years
		} else if (plan != Plan.FREE) {
			account.setSubscriptionStatus("active");
			int duration = (days != null && days > 0) ? days : 30;
			Instant currentEnd = account.getCurrentPeriodEnd();
			Instant newEnd = (currentEnd != null && currentEnd.isAfter(now))
					? currentEnd.plus(duration, ChronoUnit.DAYS)
					: now.plus(duration, ChronoUnit.DAYS);
			account.setCurrentPeriodEnd(newEnd);
		} else {
			account.setSubscriptionStatus("inactive");
			account.setCurrentPeriodEnd(null);
		}
		accountRepository.save(account);

		CreatedKey createdKey = createApiKey(account.getId(), "Admin Provisioned Key");

		Map<String, Object> result = new HashMap<>();
		result.put("accountId", account.getId().toString());
		result.put("email", account.getEmail());
		result.put("plan", account.getPlan().name());
		result.put("subscriptionStatus", account.getSubscriptionStatus());
		result.put("currentPeriodEnd", account.getCurrentPeriodEnd() != null ? account.getCurrentPeriodEnd().toString() : null);
		result.put("isLifetime", lifetime);
		result.put("apiKey", createdKey.plaintext());
		result.put("keyPrefix", createdKey.entity().getKeyPrefix());
		return result;
	}

	public PlanEntitlements entitlementsFor(Plan plan) {
		if (plan == Plan.FREE) {
			return plan.entitlements();
		}
		return pricingPlanRepository.findById(plan.name())
				.map(db -> new PlanEntitlements(
						plan,
						0,
						db.getMonthlyDocumentLimit(),
						db.isBrandFooter(),
						db.getMaxApiKeys(),
						db.getCertificateMaxRecipients()
				))
				.orElseGet(plan::entitlements);
	}

	public record CreatedKey(String plaintext, ApiKeyEntity entity) {
	}

	public record EnsureAccount(AccountEntity account, String newApiKey) {
	}

	private CreatedKey createApiKey(UUID accountId, String label) {
		String secret = randomSecret(24);
		String plaintext = KEY_PREFIX + secret;
		String prefix = KEY_PREFIX + secret.substring(0, 8);
		ApiKeyEntity entity = new ApiKeyEntity(
				UUID.randomUUID(),
				accountId,
				prefix,
				sha256(plaintext),
				label,
				Instant.now()
		);
		apiKeyRepository.save(entity);
		return new CreatedKey(plaintext, entity);
	}

	private static Plan effectivePlan(AccountEntity account) {
		Plan plan = account.getPlan() == null ? Plan.FREE : account.getPlan();
		if (plan == Plan.FREE) {
			return plan;
		}
		String status = account.getSubscriptionStatus();
		if ("lifetime".equalsIgnoreCase(status)) {
			return plan;
		}
		if (account.getCurrentPeriodEnd() != null && account.getCurrentPeriodEnd().isBefore(Instant.now())) {
			return Plan.FREE;
		}
		if (status == null) {
			return plan;
		}
		// Grace: active + past_due still entitled; canceled / unpaid -> free
		return switch (status) {
			case "active", "trialing", "past_due", "lifetime" -> plan;
			default -> Plan.FREE;
		};
	}

	private static String normalizeEmail(String raw) {
		if (raw == null || raw.isBlank() || !raw.contains("@")) {
			throw new BadRequestException("Valid email is required");
		}
		return raw.trim().toLowerCase(Locale.ROOT);
	}

	private String randomSecret(int bytes) {
		byte[] buf = new byte[bytes];
		secureRandom.nextBytes(buf);
		return HexFormat.of().formatHex(buf);
	}

	private static String sha256(String raw) {
		try {
			MessageDigest md = MessageDigest.getInstance("SHA-256");
			byte[] digest = md.digest(raw.getBytes(StandardCharsets.UTF_8));
			return HexFormat.of().formatHex(digest);
		} catch (Exception e) {
			throw new IllegalStateException("SHA-256 unavailable", e);
		}
	}
}
