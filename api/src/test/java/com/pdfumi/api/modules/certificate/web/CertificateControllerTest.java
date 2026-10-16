package com.pdfumi.api.modules.certificate.web;

import com.pdfumi.api.billing.application.AccountService;
import com.pdfumi.api.billing.application.ClientContext;
import com.pdfumi.api.modules.certificate.application.CertificateCommand;
import com.pdfumi.api.modules.certificate.application.CertificateService;
import com.pdfumi.api.modules.certificate.application.CertificateVerifyResult;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = CertificateController.class)
@AutoConfigureMockMvc(addFilters = false)
class CertificateControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private CertificateService certificateService;

	@MockitoBean
	private AccountService accountService;

	@Test
	void returnsQuota() throws Exception {
		ClientContext client = ClientContext.anonymous("127.0.0.1");
		when(accountService.resolve(any())).thenReturn(client);
		when(certificateService.quota(client)).thenReturn(Map.of("remaining", 5, "maxRecipients", 20));

		mockMvc.perform(get("/api/v1/certificates/quota"))
				.andExpect(status().isOk());
	}

	@Test
	void createsPdf() throws Exception {
		when(accountService.resolve(any())).thenReturn(ClientContext.anonymous("127.0.0.1"));
		when(certificateService.create(any(), any(CertificateCommand.class)))
				.thenReturn("%PDF-mock".getBytes());

		mockMvc.perform(post("/api/v1/certificates")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "eventTitle": "Workshop SOLID",
								  "organization": "Pdfumi Academy",
								  "eventDate": "29 September 2026",
								  "template": "classic",
								  "recipients": [
								    {"name": "Budi Santoso", "title": "Participant"}
								  ],
								  "signers": [
								    {"name": "Siti Aminah", "title": "Director"}
								  ],
								  "withBrandFooter": false
								}
								"""))
				.andExpect(status().isOk())
				.andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("certificates-pdfumi.pdf")));
	}

	@Test
	void verifiesCertificate() throws Exception {
		when(certificateService.verify("ABCD-EFGH-IJKL")).thenReturn(new CertificateVerifyResult(
				true,
				"ABCD-EFGH-IJKL",
				"Budi Santoso",
				"Participant",
				"Workshop SOLID",
				"Pdfumi Academy",
				"29 September 2026",
				Instant.parse("2026-09-29T00:00:00Z")
		));

		mockMvc.perform(get("/api/v1/certificates/verify/ABCD-EFGH-IJKL"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.valid").value(true))
				.andExpect(jsonPath("$.recipientName").value("Budi Santoso"));
	}
}
