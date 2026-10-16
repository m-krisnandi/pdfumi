package com.pdfumi.api.shared.metrics;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

@Component
public class PdfumiMetrics {

	private final MeterRegistry registry;

	public PdfumiMetrics(MeterRegistry registry) {
		this.registry = registry;
	}

	public void recordSuccess(String tool) {
		Counter.builder("pdfumi.tool.success")
				.tag("tool", tool)
				.register(registry)
				.increment();
	}

	public void recordFailure(String tool, String reason) {
		Counter.builder("pdfumi.tool.failure")
				.tag("tool", tool)
				.tag("reason", reason)
				.register(registry)
				.increment();
	}

	public void recordDuration(String tool, long startedAtNanos) {
		Timer.builder("pdfumi.tool.duration")
				.tag("tool", tool)
				.register(registry)
				.record(System.nanoTime() - startedAtNanos, TimeUnit.NANOSECONDS);
	}
}