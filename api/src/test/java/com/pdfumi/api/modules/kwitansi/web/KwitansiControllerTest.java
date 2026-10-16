package com.pdfumi.api.modules.kwitansi.web;

import com.pdfumi.api.billing.application.AccountService;
import com.pdfumi.api.billing.application.ClientContext;
import com.pdfumi.api.modules.kwitansi.application.KwitansiCommand;
import com.pdfumi.api.modules.kwitansi.application.KwitansiService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = KwitansiController.class)
@AutoConfigureMockMvc(addFilters = false)
class KwitansiControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private KwitansiService kwitansiService;

	@MockitoBean
	private AccountService accountService;

	@Test
	void returnsQuota() throws Exception {
		ClientContext client = ClientContext.anonymous("127.0.0.1");
		when(accountService.resolve(any())).thenReturn(client);
		when(kwitansiService.quota(client)).thenReturn(Map.of("remaining", 5));

		mockMvc.perform(get("/api/v1/kwitansi/quota"))
				.andExpect(status().isOk());
	}

	@Test
	void createsPdf() throws Exception {
		ClientContext client = ClientContext.anonymous("127.0.0.1");
		when(accountService.resolve(any())).thenReturn(client);
		when(kwitansiService.create(any(), any(KwitansiCommand.class)))
				.thenReturn("%PDF-mock".getBytes());

		mockMvc.perform(post("/api/v1/kwitansi")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "diterimaDari": "Budi",
								  "jumlah": 10000,
								  "untukPembayaran": "Jasa",
								  "withBrandFooter": true
								}
								"""))
				.andExpect(status().isOk())
				.andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("kwitansi-pdfumi.pdf")));
	}

	@Test
	void previewsPdf() throws Exception {
		when(kwitansiService.preview(any(KwitansiCommand.class))).thenReturn("%PDF-preview".getBytes());

		mockMvc.perform(post("/api/v1/kwitansi/preview")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "diterimaDari": "Budi",
								  "jumlah": 10000,
								  "untukPembayaran": "Jasa"
								}
								"""))
				.andExpect(status().isOk())
				.andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("kwitansi-preview.pdf")));
	}
}
