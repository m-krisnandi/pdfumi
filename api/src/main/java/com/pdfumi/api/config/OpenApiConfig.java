package com.pdfumi.api.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

	@Bean
	OpenAPI pdfumiOpenApi() {
		return new OpenAPI()
				.info(new Info()
						.title("Pdfumi API")
						.description("Enterprise document PDF utilities: kwitansi, merge, watermark.")
						.version("v1")
						.contact(new Contact().name("Pdfumi").url("https://pdfumi.com"))
						.license(new License().name("Proprietary")));
	}
}