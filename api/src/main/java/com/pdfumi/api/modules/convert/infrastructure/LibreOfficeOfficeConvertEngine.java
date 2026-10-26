package com.pdfumi.api.modules.convert.infrastructure;

import com.pdfumi.api.config.PdfumiProperties;
import com.pdfumi.api.modules.convert.application.OfficeConvertEngine;
import com.pdfumi.api.shared.exception.BadRequestException;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.util.Units;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.xwpf.usermodel.ParagraphAlignment;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.CTPageMar;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.CTPageSz;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.CTPPr;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.CTSectPr;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.STSectionMark;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigInteger;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantLock;
import java.util.stream.Stream;

/**
 * Converts Office documents with LibreOffice and converts PDF pages to visually faithful Word pages.
 * Serializes LibreOffice conversions (profile locks) and uses a per-job UserInstallation.
 */
@Component
public class LibreOfficeOfficeConvertEngine implements OfficeConvertEngine {

	private static final String DOCX = "docx";
	private static final String XLSX = "xlsx";
	private static final String PDF = "pdf";
	private static final float PDF_TO_WORD_DPI = 200f;

	private final PdfumiProperties properties;
	private final ReentrantLock lock = new ReentrantLock();

	public LibreOfficeOfficeConvertEngine(PdfumiProperties properties) {
		this.properties = properties;
	}

	@Override
	public byte[] pdfToDocx(MultipartFile pdf) {
		return convertPdfToDocx(pdf);
	}

	@Override
	public byte[] wordToPdf(MultipartFile word) {
		String name = word.getOriginalFilename() == null ? "source.docx" : word.getOriginalFilename();
		String lower = name.toLowerCase(Locale.ROOT);
		String inputName = lower.endsWith(".doc") && !lower.endsWith(".docx") ? "source.doc" : "source.docx";
		return convert(word, inputName, PDF);
	}

	@Override
	public byte[] pdfToXlsx(MultipartFile pdf) {
		return convertPdfToXlsx(pdf);
	}

	@Override
	public byte[] excelToPdf(MultipartFile excel) {
		String name = excel.getOriginalFilename() == null ? "source.xlsx" : excel.getOriginalFilename();
		String lower = name.toLowerCase(Locale.ROOT);
		String inputName = lower.endsWith(".xls") && !lower.endsWith(".xlsx") ? "source.xls" : "source.xlsx";
		return convert(excel, inputName, PDF);
	}

	private byte[] convert(MultipartFile file, String inputName, String targetExt) {
		String soffice = resolveSoffice();
		Path work = null;
		lock.lock();
		try {
			work = Files.createTempDirectory("pdfumi-lo-");
			Path inputDir = work.resolve("in");
			Path outputDir = work.resolve("out");
			Path profileDir = work.resolve("profile");
			Files.createDirectories(inputDir);
			Files.createDirectories(outputDir);
			Files.createDirectories(profileDir);

			Path input = inputDir.resolve(inputName);
			try (InputStream in = file.getInputStream()) {
				Files.copy(in, input);
			}

			String profileUri = profileDir.toAbsolutePath().toUri().toString();
			ProcessBuilder pb = new ProcessBuilder(buildCommand(
					soffice,
					profileUri,
					targetExt,
					outputDir,
					input
			));
			Path logFile = work.resolve("soffice.log");
			pb.redirectErrorStream(true);
			pb.redirectOutput(logFile.toFile());
			Process process = pb.start();
			int timeout = properties.officeTimeoutSeconds();
			boolean finished = process.waitFor(timeout, TimeUnit.SECONDS);
			if (!finished) {
				process.destroyForcibly();
				process.waitFor(5, TimeUnit.SECONDS);
				throw new IllegalStateException("LibreOffice conversion timed out after " + timeout + "s");
			}
			String log = Files.exists(logFile) ? Files.readString(logFile) : "";
			if (process.exitValue() != 0) {
				throw new IllegalStateException("LibreOffice failed (exit " + process.exitValue() + "): " + trim(log));
			}

			Path output = findOutput(outputDir, targetExt);
			if (output == null) {
				throw new IllegalStateException("LibreOffice produced no ." + targetExt + " output: " + trim(log));
			}
			byte[] bytes = Files.readAllBytes(output);
			if (bytes.length == 0) {
				throw new IllegalStateException("Empty conversion result");
			}
			return bytes;
		} catch (BadRequestException ex) {
			throw ex;
		} catch (InterruptedException ex) {
			Thread.currentThread().interrupt();
			throw new IllegalStateException("Conversion interrupted", ex);
		} catch (IOException ex) {
			throw new IllegalStateException("Conversion I/O error: " + ex.getMessage(), ex);
		} finally {
			lock.unlock();
			if (work != null) {
				deleteRecursive(work);
			}
		}
	}

	private byte[] convertPdfToDocx(MultipartFile pdf) {
		try (PDDocument source = Loader.loadPDF(pdf.getBytes());
			 XWPFDocument output = new XWPFDocument()) {
			if (source.getNumberOfPages() < 1) {
				throw new BadRequestException("PDF kosong");
			}

			PDFRenderer renderer = new PDFRenderer(source);
			List<PageSize> pageSizes = new ArrayList<>();
			for (PDPage sourcePage : source.getPages()) {
				pageSizes.add(pageSize(sourcePage));
			}
			CTSectPr bodySection = ensureBodySectionProperties(output);
			setPageSize(bodySection, pageSizes.get(0));

			for (int page = 1; page <= source.getNumberOfPages(); page++) {
				PageSize size = pageSizes.get(page - 1);
				BufferedImage rendered = renderer.renderImageWithDPI(page - 1, PDF_TO_WORD_DPI);
				appendRenderedPage(output, rendered, size);
				if (page < source.getNumberOfPages()) {
					addSectionBreak(output, size);
				}
			}
			setPageSize(bodySection, pageSizes.get(pageSizes.size() - 1));

			ByteArrayOutputStream out = new ByteArrayOutputStream();
			output.write(out);
			return out.toByteArray();
		} catch (BadRequestException ex) {
			throw ex;
		} catch (Exception ex) {
			throw new IllegalStateException("Gagal mengonversi PDF ke Word: " + ex.getMessage(), ex);
		}
	}

	private byte[] convertPdfToXlsx(MultipartFile pdf) {
		try (PDDocument source = Loader.loadPDF(pdf.getBytes());
			 XSSFWorkbook workbook = new XSSFWorkbook()) {
			if (source.getNumberOfPages() < 1) {
				throw new BadRequestException("PDF kosong");
			}

			XSSFSheet sheet = workbook.createSheet("PDF");
			PDFTextStripper stripper = new PDFTextStripper();
			int rowNumber = 0;
			for (int page = 1; page <= source.getNumberOfPages(); page++) {
				stripper.setStartPage(page);
				stripper.setEndPage(page);
				String text = stripper.getText(source);
				for (String line : text.split("\\R", -1)) {
					if (line.isBlank()) {
						continue;
					}
					var row = sheet.createRow(rowNumber++);
					String[] cells = line.trim().split("\\t|\\s{2,}");
					for (int column = 0; column < cells.length; column++) {
						row.createCell(column).setCellValue(truncateCell(cells[column].trim()));
					}
				}
				if (page < source.getNumberOfPages()) {
					sheet.createRow(rowNumber++).createCell(0).setCellValue("[Halaman " + page + "]");
				}
			}
			for (int column = 0; column < 20; column++) {
				sheet.setColumnWidth(column, 18 * 256);
			}

			ByteArrayOutputStream out = new ByteArrayOutputStream();
			workbook.write(out);
			return out.toByteArray();
		} catch (BadRequestException ex) {
			throw ex;
		} catch (Exception ex) {
			throw new IllegalStateException("Gagal mengonversi PDF ke Excel: " + ex.getMessage(), ex);
		}
	}

	private static void appendRenderedPage(XWPFDocument output, BufferedImage image, PageSize size) throws Exception {
		ByteArrayOutputStream imageOut = new ByteArrayOutputStream();
		ImageIO.write(image, "png", imageOut);
		XWPFParagraph paragraph = output.createParagraph();
		paragraph.setAlignment(ParagraphAlignment.CENTER);
		paragraph.setSpacingBefore(0);
		paragraph.setSpacingAfter(0);
		paragraph.setIndentationLeft(0);
		paragraph.setIndentationRight(0);
		XWPFRun run = paragraph.createRun();
		run.addPicture(
				new java.io.ByteArrayInputStream(imageOut.toByteArray()),
				XWPFDocument.PICTURE_TYPE_PNG,
				"page.png",
				Units.toEMU(size.widthPoints()),
				Units.toEMU(size.heightPoints())
		);
	}

	private static void addSectionBreak(XWPFDocument output, PageSize nextPageSize) {
		XWPFParagraph breakParagraph = output.createParagraph();
		breakParagraph.setSpacingBefore(0);
		breakParagraph.setSpacingAfter(0);
		CTPPr pPr = breakParagraph.getCTP().isSetPPr()
				? breakParagraph.getCTP().getPPr()
				: breakParagraph.getCTP().addNewPPr();
		CTSectPr section = pPr.addNewSectPr();
		section.addNewType().setVal(STSectionMark.NEXT_PAGE);
		setPageSize(section, nextPageSize);
	}

	private static PageSize pageSize(PDPage page) {
		var crop = page.getCropBox();
		float width = crop.getWidth();
		float height = crop.getHeight();
		int rotation = ((page.getRotation() % 360) + 360) % 360;
		if (rotation == 90 || rotation == 270) {
			return new PageSize(height, width);
		}
		return new PageSize(width, height);
	}

	private static void setPageSize(CTSectPr section, PageSize size) {
		CTPageSz pageSize = section.isSetPgSz() ? section.getPgSz() : section.addNewPgSz();
		pageSize.setW(BigInteger.valueOf(Math.round(size.widthPoints() * 20)));
		pageSize.setH(BigInteger.valueOf(Math.round(size.heightPoints() * 20)));

		CTPageMar margins = section.isSetPgMar() ? section.getPgMar() : section.addNewPgMar();
		margins.setTop(BigInteger.ZERO);
		margins.setRight(BigInteger.ZERO);
		margins.setBottom(BigInteger.ZERO);
		margins.setLeft(BigInteger.ZERO);
		margins.setHeader(BigInteger.ZERO);
		margins.setFooter(BigInteger.ZERO);
		margins.setGutter(BigInteger.ZERO);
	}

	private static CTSectPr ensureBodySectionProperties(XWPFDocument document) {
		var body = document.getDocument().getBody();
		return body.isSetSectPr() ? body.getSectPr() : body.addNewSectPr();
	}

	private record PageSize(float widthPoints, float heightPoints) {
	}

	private static String truncateCell(String value) {
		return value.length() <= 32767 ? value : value.substring(0, 32764) + "...";
	}

	private static List<String> buildCommand(
			String soffice,
			String profileUri,
			String targetExt,
			Path outputDir,
			Path input
	) {
		String filter = switch (targetExt) {
			case PDF -> "pdf:writer_pdf_Export";
			case DOCX -> "docx:MS Word 2007 XML";
			case XLSX -> "xlsx:Calc MS Excel 2007 XML";
			default -> targetExt;
		};
		return List.of(
				soffice,
				"--headless",
				"--nologo",
				"--nofirststartwizard",
				"--norestore",
				"--nodefault",
				"--nolockcheck",
				"-env:UserInstallation=" + profileUri,
				"--convert-to", filter,
				"--outdir", outputDir.toAbsolutePath().toString(),
				input.toAbsolutePath().toString()
		);
	}

	private String resolveSoffice() {
		String configured = properties.sofficePath();
		Path configuredPath = Path.of(configured);
		if (configuredPath.isAbsolute() && Files.isExecutable(configuredPath)) {
			return configuredPath.toString();
		}
		Path mac = Path.of("/Applications/LibreOffice.app/Contents/MacOS/soffice");
		if (Files.isExecutable(mac)) {
			return mac.toString();
		}
		Path linux = Path.of("/usr/bin/soffice");
		if (Files.isExecutable(linux)) {
			return linux.toString();
		}
		Path linuxLibreOffice = Path.of("/usr/bin/libreoffice");
		if (Files.isExecutable(linuxLibreOffice)) {
			return linuxLibreOffice.toString();
		}
		Path linuxProgram = Path.of("/usr/lib/libreoffice/program/soffice");
		if (Files.isExecutable(linuxProgram)) {
			return linuxProgram.toString();
		}
		if ("soffice".equals(configured) || configured.isBlank()) {
			// Rely on PATH — ProcessBuilder will fail clearly if missing
			return "soffice";
		}
		return configured;
	}

	private static Path findOutput(Path outputDir, String ext) throws IOException {
		String suffix = "." + ext.toLowerCase(Locale.ROOT);
		try (Stream<Path> stream = Files.list(outputDir)) {
			return stream
					.filter(p -> p.getFileName().toString().toLowerCase(Locale.ROOT).endsWith(suffix))
					.findFirst()
					.orElse(null);
		}
	}

	private static void deleteRecursive(Path root) {
		try (Stream<Path> walk = Files.walk(root)) {
			walk.sorted(Comparator.reverseOrder()).forEach(p -> {
				try {
					Files.deleteIfExists(p);
				} catch (IOException ignored) {
					/* best-effort cleanup */
				}
			});
		} catch (IOException ignored) {
			/* best-effort cleanup */
		}
	}

	private static String trim(String log) {
		if (log == null) {
			return "";
		}
		String t = log.trim();
		return t.length() > 500 ? t.substring(0, 500) + "…" : t;
	}
}
