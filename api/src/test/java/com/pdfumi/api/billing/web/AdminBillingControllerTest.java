package com.pdfumi.api.billing.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pdfumi.api.billing.application.AdminManagementService;
import com.pdfumi.api.billing.application.AdminManagementService.GrantAccountRequest;
import com.pdfumi.api.billing.application.AdminManagementService.ProvisionAccountRequest;
import com.pdfumi.api.billing.application.PromoCodeService.CreatePromoRequest;
import com.pdfumi.api.billing.infrastructure.PromoCodeEntity;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AdminBillingController.class)
@AutoConfigureMockMvc(addFilters = false)
class AdminBillingControllerTest {

	@Autowired
	private MockMvc mockMvc;

	private final ObjectMapper objectMapper = new ObjectMapper();

	@MockitoBean
	private AdminManagementService adminManagementService;

	@Test
	void getStats_returnsMetrics() throws Exception {
		when(adminManagementService.getStats("secret123")).thenReturn(Map.of(
				"totalAccounts", 25L,
				"totalOrders", 12L,
				"paidOrders", 10L,
				"totalRevenueIdr", 290000L
		));

		mockMvc.perform(get("/api/v1/billing/admin/stats")
						.header("X-Admin-Key", "secret123"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.totalAccounts").value(25))
				.andExpect(jsonPath("$.paidOrders").value(10))
				.andExpect(jsonPath("$.totalRevenueIdr").value(290000));
	}

	@Test
	void getOrders_returnsOrdersList() throws Exception {
		when(adminManagementService.getOrders(eq("secret123"), eq("PAID"))).thenReturn(List.of(
				Map.of(
						"orderReference", "QRS-ABC-123",
						"accountEmail", "user@example.com",
						"plan", "PRO",
						"amount", 29000,
						"status", "PAID"
				)
		));

		mockMvc.perform(get("/api/v1/billing/admin/orders")
						.param("status", "PAID")
						.header("X-Admin-Key", "secret123"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].orderReference").value("QRS-ABC-123"))
				.andExpect(jsonPath("$[0].accountEmail").value("user@example.com"))
				.andExpect(jsonPath("$[0].status").value("PAID"));
	}

	@Test
	void markOrderPaid_verifiesOrder() throws Exception {
		when(adminManagementService.markOrderPaid("secret123", "QRS-ABC-123")).thenReturn(Map.of(
				"status", "PAID",
				"orderReference", "QRS-ABC-123"
		));

		mockMvc.perform(post("/api/v1/billing/admin/orders/QRS-ABC-123/mark-paid")
						.header("X-Admin-Key", "secret123"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("PAID"))
				.andExpect(jsonPath("$.orderReference").value("QRS-ABC-123"));
	}

	@Test
	void grantAccount_updatesAccountPlan() throws Exception {
		UUID accId = UUID.randomUUID();
		GrantAccountRequest req = new GrantAccountRequest("PRO", 30, false);
		when(adminManagementService.grantAccount(eq("secret123"), eq(accId), any(GrantAccountRequest.class)))
				.thenReturn(Map.of("id", accId.toString(), "plan", "PRO", "subscriptionStatus", "active"));

		mockMvc.perform(post("/api/v1/billing/admin/accounts/" + accId + "/grant")
						.header("X-Admin-Key", "secret123")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(req)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.plan").value("PRO"))
				.andExpect(jsonPath("$.subscriptionStatus").value("active"));
	}

	@Test
	void provisionAccount_createsCustomVipAccount() throws Exception {
		ProvisionAccountRequest req = new ProvisionAccountRequest("vip@partner.com", "UNLIMITED", 365, true);
		when(adminManagementService.provisionAccount(eq("secret123"), any(ProvisionAccountRequest.class)))
				.thenReturn(Map.of(
						"email", "vip@partner.com",
						"plan", "UNLIMITED",
						"isLifetime", true,
						"apiKey", "pdfumi_abc123"
				));

		mockMvc.perform(post("/api/v1/billing/admin/accounts/provision")
						.header("X-Admin-Key", "secret123")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(req)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.email").value("vip@partner.com"))
				.andExpect(jsonPath("$.plan").value("UNLIMITED"))
				.andExpect(jsonPath("$.isLifetime").value(true))
				.andExpect(jsonPath("$.apiKey").value("pdfumi_abc123"));
	}

	@Test
	void createPromo_createsPromoCode() throws Exception {
		CreatePromoRequest req = new CreatePromoRequest("LAUNCH100", 100, "ALL", 50, null);
		PromoCodeEntity promo = new PromoCodeEntity("LAUNCH100", 100, "ALL", 50, 0, null, true, Instant.now());
		when(adminManagementService.createPromoCode(eq("secret123"), any(CreatePromoRequest.class)))
				.thenReturn(promo);

		mockMvc.perform(post("/api/v1/billing/admin/promos")
						.header("X-Admin-Key", "secret123")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(req)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.code").value("LAUNCH100"))
				.andExpect(jsonPath("$.discountPercent").value(100));
	}
}
