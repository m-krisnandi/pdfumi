package com.pdfumi.api.billing.application;

import com.pdfumi.api.billing.domain.Plan;
import com.pdfumi.api.billing.infrastructure.AccountEntity;
import com.pdfumi.api.billing.infrastructure.AccountRepository;
import com.pdfumi.api.billing.infrastructure.PaymentOrderEntity;
import com.pdfumi.api.billing.infrastructure.PaymentOrderRepository;
import com.pdfumi.api.billing.infrastructure.PricingPlanRepository;
import com.pdfumi.api.billing.infrastructure.PromoCodeRepository;
import com.pdfumi.api.config.PdfumiProperties;
import com.pdfumi.api.modules.certificate.infrastructure.ZxingQrCodeEncoder;
import com.pdfumi.api.shared.mail.TransactionalMailer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
class QrisPaymentServiceTest {

	@Mock
	private PaymentOrderRepository orderRepository;

	@Mock
	private PricingPlanRepository pricingPlanRepository;

	@Mock
	private AccountService accountService;

	@Mock
	private AccountRepository accountRepository;

	@Mock
	private TransactionalMailer mailer;

	@Mock
	private PromoCodeRepository promoCodeRepository;

	private QrisPaymentService qrisPaymentService;
	private AccountEntity account;

	@BeforeEach
	void setUp() {
		PdfumiProperties properties = new PdfumiProperties(
				"http://localhost:3000",
				"footer",
				"http://localhost:3000",
				"http://localhost:8080",
				24,
				new PdfumiProperties.Free(5, 20),
				new PdfumiProperties.Security("actuator", "secret", true),
				new PdfumiProperties.Tripay("", "", "", "sandbox", 19000, 29000, 149000),
				null,
				null,
				null
		);

		UUID accountId = UUID.randomUUID();
		account = new AccountEntity(accountId, "user@example.com", Plan.FREE, Instant.now());

		lenient().when(accountService.ensureAccount(any())).thenReturn(new AccountService.EnsureAccount(account, null));
		lenient().when(accountService.requireAccount(accountId)).thenReturn(account);
		lenient().when(accountService.accounts()).thenReturn(accountRepository);
		lenient().when(accountRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
		lenient().when(orderRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
		lenient().when(pricingPlanRepository.findById(any())).thenReturn(Optional.empty());

		qrisPaymentService = new QrisPaymentService(
				orderRepository,
				pricingPlanRepository,
				accountService,
				properties,
				new ZxingQrCodeEncoder(),
				mailer,
				promoCodeRepository
		);
	}

	@Test
	void createOrder_generatesQrDataUrlInSandboxMode() {
		Map<String, Object> res = qrisPaymentService.createOrder(
				ClientContext.anonymous("127.0.0.1"),
				"PASS",
				"user@example.com",
				"id"
		);

		assertThat(res.get("orderReference")).isNotNull();
		assertThat(res.get("qrDataUrl")).asString().startsWith("data:image/png;base64,");
		assertThat(res.get("plan")).isEqualTo("PASS");
		assertThat(res.get("amount")).isEqualTo(19000);
	}

	@Test
	void markOrderPaid_updatesAccountSubscriptionAndDuration() {
		UUID orderId = UUID.randomUUID();
		PaymentOrderEntity order = new PaymentOrderEntity(
				orderId,
				account.getId(),
				"QRS-TEST-123",
				"TRIPAY",
				Plan.PRO,
				1,
				29000,
				"UNPAID",
				"qr",
				"url",
				"checkout",
				Instant.now().plusSeconds(3600),
				Instant.now()
		);
		lenient().when(orderRepository.findByOrderReference("QRS-TEST-123")).thenReturn(Optional.of(order));

		qrisPaymentService.markOrderPaid("QRS-TEST-123");

		assertThat(order.getStatus()).isEqualTo("PAID");
		assertThat(order.getPaidAt()).isNotNull();
		assertThat(account.getPlan()).isEqualTo(Plan.PRO);
		assertThat(account.getSubscriptionStatus()).isEqualTo("active");
		assertThat(account.getCurrentPeriodEnd()).isNotNull();
	}
}
