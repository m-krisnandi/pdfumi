package com.pdfumi.api.quota;

import com.pdfumi.api.billing.application.ClientContext;

import java.util.Map;

/**
 * Port for usage quota. Implementations may use memory (tests) or DB (production).
 */
public interface QuotaService {

	void consume(ClientContext client, String tool);

	Map<String, Object> status(ClientContext client, String tool);
}
