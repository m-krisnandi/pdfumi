package com.pdfumi.api.shared.exception;

import com.pdfumi.api.shared.web.RequestIdFilter;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.net.URI;
import java.time.Instant;

@RestControllerAdvice
public class ApiExceptionHandler {

	private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

	@ExceptionHandler(QuotaExceededException.class)
	public ProblemDetail quota(QuotaExceededException ex, HttpServletRequest request) {
		return problem(HttpStatus.TOO_MANY_REQUESTS, "quota_exceeded", ex.getMessage(), request);
	}

	@ExceptionHandler(NotFoundException.class)
	public ProblemDetail notFound(NotFoundException ex, HttpServletRequest request) {
		return problem(HttpStatus.NOT_FOUND, "not_found", ex.getMessage(), request);
	}

	@ExceptionHandler(ForbiddenException.class)
	public ProblemDetail forbidden(ForbiddenException ex, HttpServletRequest request) {
		return problem(HttpStatus.FORBIDDEN, "forbidden", ex.getMessage(), request);
	}

	@ExceptionHandler({BadRequestException.class, IllegalArgumentException.class})
	public ProblemDetail badRequest(RuntimeException ex, HttpServletRequest request) {
		return problem(HttpStatus.BAD_REQUEST, "bad_request", ex.getMessage(), request);
	}

	@ExceptionHandler(HttpMessageNotReadableException.class)
	public ProblemDetail unreadable(HttpMessageNotReadableException ex, HttpServletRequest request) {
		return problem(HttpStatus.BAD_REQUEST, "bad_request", "Body tidak valid", request);
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ProblemDetail validation(MethodArgumentNotValidException ex, HttpServletRequest request) {
		String message = ex.getBindingResult().getFieldErrors().stream()
				.findFirst()
				.map(this::formatFieldError)
				.orElse("Validation failed");
		return problem(HttpStatus.BAD_REQUEST, "validation_error", message, request);
	}

	@ExceptionHandler(HttpRequestMethodNotSupportedException.class)
	public ProblemDetail methodNotAllowed(HttpRequestMethodNotSupportedException ex, HttpServletRequest request) {
		return problem(HttpStatus.METHOD_NOT_ALLOWED, "method_not_allowed",
				"Metode HTTP tidak didukung untuk endpoint ini", request);
	}

	@ExceptionHandler(NoResourceFoundException.class)
	public ProblemDetail notFoundResource(NoResourceFoundException ex, HttpServletRequest request) {
		return problem(HttpStatus.NOT_FOUND, "not_found", "Endpoint tidak ditemukan", request);
	}

	@ExceptionHandler(Exception.class)
	public ProblemDetail generic(Exception ex, HttpServletRequest request) {
		log.error("Unhandled error on {} {}", request.getMethod(), request.getRequestURI(), ex);
		return problem(HttpStatus.INTERNAL_SERVER_ERROR, "internal_error", "Gagal memproses dokumen", request);
	}

	private ProblemDetail problem(HttpStatus status, String code, String detail, HttpServletRequest request) {
		ProblemDetail pd = ProblemDetail.forStatusAndDetail(status, detail);
		pd.setTitle(status.getReasonPhrase());
		pd.setType(URI.create("https://pdfumi.com/problems//" + code));
		pd.setProperty("code", code);
		pd.setProperty("timestamp", Instant.now().toString());
		pd.setProperty("path", request.getRequestURI());
		pd.setProperty("requestId", MDC.get(RequestIdFilter.MDC_KEY));
		return pd;
	}

	private String formatFieldError(FieldError error) {
		return error.getField() + ": " + error.getDefaultMessage();
	}
}
