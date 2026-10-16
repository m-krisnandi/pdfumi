package com.pdfumi.api.billing.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pdfumi.api.billing.application.PricingPlanService;
import com.pdfumi.api.billing.application.PricingPlanService.PlanUpdateRequest;
import com.pdfumi.api.billing.infrastructure.PricingPlanEntity;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = PricingPlanController.class)
@AutoConfigureMockMvc(addFilters = false)
class PricingPlanControllerTest {

	@Autowired
	private MockMvc mockMvc;

	private final ObjectMapper objectMapper = new ObjectMapper();

	@MockitoBean
	private PricingPlanService pricingPlanService;

	@Test
	void getPublicPlans_returnsActivePlans() throws Exception {
		PricingPlanEntity pass = new PricingPlanEntity(
				"PASS", "Event Pass", 19000, 2, 7, 150, 100, 1, false, "Promo", true, Instant.now()
		);
		when(pricingPlanService.getActivePlans()).thenReturn(List.of(pass));

		mockMvc.perform(get("/api/v1/billing/plans"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].id").value("PASS"))
				.andExpect(jsonPath("$[0].priceIdr").value(19000))
				.andExpect(jsonPath("$[0].badge").value("Promo"));
	}

	@Test
	void updatePlan_callsServiceAndReturnsUpdatedPlan() throws Exception {
		PricingPlanEntity updated = new PricingPlanEntity(
				"PASS", "Event Pass Diskon", 15000, 2, 7, 150, 100, 1, false, "Flash Sale", true, Instant.now()
		);
		when(pricingPlanService.updatePlan(eq("PASS"), any(PlanUpdateRequest.class), eq("secret123")))
				.thenReturn(updated);

		PlanUpdateRequest body = new PlanUpdateRequest(
				"Event Pass Diskon", 15000, null, null, null, null, null, null, "Flash Sale", null
		);

		mockMvc.perform(put("/api/v1/billing/admin/plans/PASS")
						.header("X-Admin-Key", "secret123")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(body)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.priceIdr").value(15000))
				.andExpect(jsonPath("$.badge").value("Flash Sale"));
	}
}
