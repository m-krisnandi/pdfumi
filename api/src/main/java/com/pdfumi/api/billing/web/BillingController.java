package com.pdfumi.api.billing.web;

import com.pdfumi.api.billing.application.AccountLoginService;
import com.pdfumi.api.billing.application.AccountRecoveryService;
import com.pdfumi.api.billing.application.AccountService;
import com.pdfumi.api.billing.application.MidtransPaymentService;
import com.pdfumi.api.config.PdfumiProperties;
import com.pdfumi.api.billing.application.ClientContext;
import com.pdfumi.api.billing.application.PromoCodeService;
import com.pdfumi.api.billing.application.QrisPaymentService;
import com.pdfumi.api.billing.application.WebSessionService;
import com.pdfumi.api.quota.QuotaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Billing")
public class BillingController {

	private final AccountService accountService;
	private final AccountRecoveryService accountRecoveryService;
	private final AccountLoginService accountLoginService;
	private final QrisPaymentService qrisPaymentService;
	private final QuotaService quotaService;
	private final PromoCodeService promoCodeService;
	private final MidtransPaymentService midtransPaymentService;
	private final PdfumiProperties properties;

	public BillingController(
			AccountService accountService,
			AccountRecoveryService accountRecoveryService,
			AccountLoginService accountLoginService,
			QrisPaymentService qrisPaymentService,
			QuotaService quotaService,
			PromoCodeService promoCodeService,
			MidtransPaymentService midtransPaymentService,
			PdfumiProperties properties
	) {
		this.accountService = accountService;
		this.accountRecoveryService = accountRecoveryService;
		this.accountLoginService = accountLoginService;
		this.qrisPaymentService = qrisPaymentService;
		this.quotaService = quotaService;
		this.promoCodeService = promoCodeService;
		this.midtransPaymentService = midtransPaymentService;
		this.properties = properties;
	}

	@PostMapping("/account/register")
	@Operation(summary = "Create free account + API key (key shown once)")
	public Map<String, Object> register(@RequestBody RegisterRequest body) {
		return accountService.register(body.email());
	}

	@PostMapping("/account/login")
	@Operation(summary = "Request magic-link sign-in email")
	public Map<String, Object> login(@RequestBody LoginRequest body) {
		return accountLoginService.requestLogin(body.email(), body.locale());
	}

	@PostMapping("/account/login/confirm")
	@Operation(summary = "Confirm magic-link sign-in and create web session")
	public Map<String, Object> confirmLogin(@RequestBody ConfirmLoginRequest body) {
		return accountLoginService.confirmLogin(body.token());
	}

	@PostMapping("/account/login/google")
	@Operation(summary = "Login or register instantly via Google authentication")
	public Map<String, Object> loginGoogle(@RequestBody GoogleLoginRequest body) {
		return accountService.loginWithGoogle(body.email());
	}

	@PostMapping("/account/logout")
	@Operation(summary = "Revoke current web session")
	public Map<String, Object> logout(HttpServletRequest request) {
		String session = request.getHeader(WebSessionService.SESSION_HEADER);
		return accountLoginService.logout(session);
	}

	@PostMapping("/account/recover")
	@Operation(summary = "Request API key recovery email (magic link)")
	public Map<String, Object> recover(@RequestBody RecoverRequest body) {
		return accountRecoveryService.requestRecovery(body.email(), body.locale());
	}

	@PostMapping("/account/recover/confirm")
	@Operation(summary = "Confirm recovery token and issue a new API key")
	public Map<String, Object> confirmRecover(@RequestBody ConfirmRecoverRequest body) {
		return accountRecoveryService.confirmRecovery(body.token());
	}

	@GetMapping("/account/me")
	@Operation(summary = "Current account (requires X-Session-Token or X-Api-Key)")
	public Map<String, Object> me(HttpServletRequest request) {
		ClientContext client = accountService.resolve(request);
		Map<String, Object> me = accountService.me(client);
		return Map.of(
				"account", me,
				"quota", quotaService.status(client, "all")
		);
	}

	@PostMapping("/account/api-keys")
	@Operation(summary = "Create additional API key within plan limit")
	public Map<String, Object> createKey(HttpServletRequest request, @RequestBody(required = false) CreateKeyRequest body) {
		ClientContext client = accountService.resolve(request);
		return accountService.createAdditionalKey(client, body == null ? null : body.label());
	}

	@GetMapping("/billing/status")
	@Operation(summary = "Payment gateway status (Midtrans)")
	public Map<String, Object> billingStatus() {
		return Map.of(
				"midtransEnabled", properties.midtransEnabled(),
				"midtransClientKey", properties.midtransClientKey(),
				"midtransMode", properties.midtransMode(),
				"pricePassIdr", properties.pricePassIdr(),
				"priceProIdr", properties.priceProIdr(),
				"priceBusinessIdr", properties.priceBusinessIdr()
		);
	}

	@PostMapping("/billing/checkout")
	@Operation(summary = "Start Midtrans Checkout for PASS, PRO, or BUSINESS")
	public Map<String, Object> checkout(HttpServletRequest request, @RequestBody CheckoutRequest body) {
		ClientContext client = accountService.resolve(request);
		return midtransPaymentService.createSnapTransaction(client, body.plan(), body.email(), body.locale(), body.promoCode());
	}

	@PostMapping("/billing/midtrans/create")
	@Operation(summary = "Start Midtrans Snap transaction for QRIS, Credit Card, or Virtual Account")
	public Map<String, Object> createMidtrans(HttpServletRequest request, @RequestBody QrisCreateRequest body) {
		ClientContext client = accountService.resolve(request);
		return midtransPaymentService.createSnapTransaction(client, body.plan(), body.email(), body.locale(), body.promoCode());
	}

	@PostMapping(path = "/billing/midtrans/webhook", consumes = MediaType.APPLICATION_JSON_VALUE)
	@Operation(summary = "Midtrans payment notification webhook")
	public Map<String, Object> midtransWebhook(@RequestBody Map<String, Object> payload) {
		return midtransPaymentService.handleMidtransWebhook(payload);
	}



	@PostMapping("/billing/qris/create")
	@Operation(summary = "Create QRIS payment order (Midtrans)")
	public Map<String, Object> createQris(HttpServletRequest request, @RequestBody QrisCreateRequest body) {
		ClientContext client = accountService.resolve(request);
		return midtransPaymentService.createSnapTransaction(client, body.plan(), body.email(), body.locale(), body.promoCode());
	}

	@GetMapping("/billing/qris/status/{orderReference}")
	@Operation(summary = "Poll QRIS payment status")
	public Map<String, Object> checkQrisStatus(@PathVariable String orderReference) {
		return qrisPaymentService.checkStatus(orderReference);
	}

	@PostMapping("/billing/qris/simulate-pay/{orderReference}")
	@Operation(summary = "Simulate QRIS payment in development / sandbox mode")
	public Map<String, Object> simulateQrisPay(@PathVariable String orderReference) {
		return qrisPaymentService.simulatePayment(orderReference);
	}

	// --- Promo Code Public Endpoints ---

	@PostMapping("/billing/promo/check")
	@Operation(summary = "Check and validate promo code discount")
	public Map<String, Object> checkPromo(@RequestBody PromoCheckRequest body) {
		return promoCodeService.checkPromo(body.code(), body.plan());
	}

	@PostMapping("/billing/promo/redeem")
	@Operation(summary = "Redeem 100% free promo code directly without payment gateway")
	public Map<String, Object> redeemPromo(@RequestBody PromoRedeemRequest body) {
		return promoCodeService.redeem100PercentFree(body.code(), body.email(), body.plan());
	}

	public record RegisterRequest(@NotBlank @Email String email) {
	}

	public record LoginRequest(@NotBlank @Email String email, String locale) {
	}

	public record ConfirmLoginRequest(@NotBlank String token) {
	}

	public record GoogleLoginRequest(@NotBlank @Email String email) {
	}

	public record RecoverRequest(@NotBlank @Email String email, String locale) {
	}

	public record ConfirmRecoverRequest(@NotBlank String token) {
	}

	public record CreateKeyRequest(String label) {
	}

	public record CheckoutRequest(
			@NotBlank String plan,
			String email,
			String locale,
			String promoCode
	) {
	}

	public record QrisCreateRequest(
			@NotBlank String plan,
			String email,
			String locale,
			String promoCode
	) {
	}

	public record PromoCheckRequest(
			@NotBlank String code,
			String plan
	) {
	}

	public record PromoRedeemRequest(
			@NotBlank String code,
			@NotBlank @Email String email,
			@NotBlank String plan
	) {
	}
}
