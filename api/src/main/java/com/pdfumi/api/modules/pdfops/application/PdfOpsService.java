package com.pdfumi.api.modules.pdfops.application;

import com.pdfumi.api.billing.application.ClientContext;
import com.pdfumi.api.quota.QuotaService;
import com.pdfumi.api.shared.exception.BadRequestException;
import com.pdfumi.api.shared.metrics.PdfumiMetrics;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
public class PdfOpsService {

	public static final String TOOL_COMPRESS = "compress";
	public static final String TOOL_SPLIT = "split";
	public static final String TOOL_ROTATE = "rotate";
	public static final String TOOL_DELETE_PAGES = "delete-pages";
	public static final String TOOL_EXTRACT_PAGES = "extract-pages";
	public static final String TOOL_ORGANIZE = "organize";
	public static final String TOOL_PROTECT = "protect";
	public static final String TOOL_UNLOCK = "unlock";
	public static final String TOOL_PAGE_NUMBERS = "page-numbers";
	public static final String TOOL_CROP = "crop";
	public static final String TOOL_SIGN = "sign";

	private final QuotaService quotaService;
	private final PdfOpsEngine engine;
	private final PdfumiMetrics metrics;

	public PdfOpsService(
			QuotaService quotaService,
			PdfOpsEngine engine,
			PdfumiMetrics metrics
	) {
		this.quotaService = quotaService;
		this.engine = engine;
		this.metrics = metrics;
	}

	public byte[] compress(ClientContext client, MultipartFile file) {
		return run(TOOL_COMPRESS, () -> {
			validatePdf(client, file);
			byte[] res = engine.compress(file);
			quotaService.consume(client, TOOL_COMPRESS);
			return res;
		});
	}

	public byte[] splitPages(ClientContext client, MultipartFile file, List<Integer> pageNumbers1Based) {
		return run(TOOL_SPLIT, () -> {
			validatePdf(client, file);
			byte[] res = engine.splitPages(file, pageNumbers1Based == null ? List.of() : pageNumbers1Based);
			quotaService.consume(client, TOOL_SPLIT);
			return res;
		});
	}

	public byte[] rotate(ClientContext client, MultipartFile file, int degrees, List<Integer> pageNumbers1Based) {
		return run(TOOL_ROTATE, () -> {
			validatePdf(client, file);
			byte[] res = engine.rotate(file, degrees, pageNumbers1Based == null ? List.of() : pageNumbers1Based);
			quotaService.consume(client, TOOL_ROTATE);
			return res;
		});
	}

	public byte[] deletePages(ClientContext client, MultipartFile file, List<Integer> pageNumbers1Based) {
		return deletePages(client, file, pageNumbers1Based, false);
	}

	public byte[] deletePages(
			ClientContext client,
			MultipartFile file,
			List<Integer> pageNumbers1Based,
			boolean commitOnly
	) {
		return run(TOOL_DELETE_PAGES, () -> {
			validatePdf(client, file);
			if (!commitOnly && (pageNumbers1Based == null || pageNumbers1Based.isEmpty())) {
				throw new BadRequestException("Pilih minimal 1 halaman untuk dihapus");
			}
			byte[] res = engine.deletePages(file, pageNumbers1Based == null ? List.of() : pageNumbers1Based);
			quotaService.consume(client, TOOL_DELETE_PAGES);
			return res;
		});
	}

	public byte[] extractPages(ClientContext client, MultipartFile file, List<Integer> pageNumbers1Based) {
		return run(TOOL_EXTRACT_PAGES, () -> {
			validatePdf(client, file);
			byte[] res = engine.extractPages(file, pageNumbers1Based == null ? List.of() : pageNumbers1Based);
			quotaService.consume(client, TOOL_EXTRACT_PAGES);
			return res;
		});
	}

	public byte[] organize(ClientContext client, MultipartFile file, List<Integer> pageOrder1Based) {
		return run(TOOL_ORGANIZE, () -> {
			validatePdf(client, file);
			byte[] res = engine.organize(file, pageOrder1Based == null ? List.of() : pageOrder1Based);
			quotaService.consume(client, TOOL_ORGANIZE);
			return res;
		});
	}

	public byte[] protect(ClientContext client, MultipartFile file, String userPassword, String ownerPassword) {
		return run(TOOL_PROTECT, () -> {
			validatePdf(client, file);
			if (userPassword == null || userPassword.isBlank()) {
				throw new BadRequestException("Password is required to protect PDF");
			}
			byte[] res = engine.protect(file, userPassword, ownerPassword);
			quotaService.consume(client, TOOL_PROTECT);
			return res;
		});
	}

	public byte[] unlock(ClientContext client, MultipartFile file, String password) {
		return run(TOOL_UNLOCK, () -> {
			validatePdf(client, file);
			byte[] res = engine.unlock(file, password == null ? "" : password);
			quotaService.consume(client, TOOL_UNLOCK);
			return res;
		});
	}

	public byte[] addPageNumbers(
			ClientContext client,
			MultipartFile file,
			String position,
			String format
	) {
		return run(TOOL_PAGE_NUMBERS, () -> {
			validatePdf(client, file);
			byte[] res = engine.addPageNumbers(file, position, format);
			quotaService.consume(client, TOOL_PAGE_NUMBERS);
			return res;
		});
	}

	public byte[] crop(ClientContext client, MultipartFile file, float left, float right, float top, float bottom) {
		return run(TOOL_CROP, () -> {
			validatePdf(client, file);
			byte[] res = engine.crop(file, left, right, top, bottom);
			quotaService.consume(client, TOOL_CROP);
			return res;
		});
	}

	public byte[] sign(
			ClientContext client,
			MultipartFile file,
			MultipartFile signature,
			float x,
			float y,
			float width,
			int page
	) {
		return run(TOOL_SIGN, () -> {
			validatePdf(client, file);
			byte[] res = engine.sign(file, signature, x, y, width, page);
			quotaService.consume(client, TOOL_SIGN);
			return res;
		});
	}

	private byte[] run(String tool, Action action) {
		long started = System.nanoTime();
		try {
			byte[] out = action.execute();
			metrics.recordSuccess(tool);
			return out;
		} catch (RuntimeException ex) {
			metrics.recordFailure(tool, "error");
			throw ex;
		} finally {
			metrics.recordDuration(tool, started);
		}
	}

	private void validatePdf(ClientContext client, MultipartFile file) {
		if (file == null || file.isEmpty()) {
			throw new BadRequestException("File PDF tidak boleh kosong");
		}
		long maxBytes = client.entitlements().maxFileSizeBytes();
		int maxMb = client.entitlements().maxFileSizeMb();
		if (file.getSize() > maxBytes) {
			throw new BadRequestException("Ukuran file melebihi batas " + maxMb + "MB untuk paket " + client.plan().name());
		}
	}

	@FunctionalInterface
	private interface Action {
		byte[] execute();
	}
}
