package com.pdfumi.api;

import com.pdfumi.api.config.PdfumiProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EnableConfigurationProperties(PdfumiProperties.class)
public class PdfumiApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(PdfumiApiApplication.class, args);
	}

}
