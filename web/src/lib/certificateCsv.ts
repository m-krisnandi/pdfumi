export type CertificateRecipient = {
  name: string;
  title?: string;
};

/**
 * Parse CSV with headers name[,title]. First row may be a header.
 * Also accepts simple one-name-per-line lists without headers.
 */
export function parseCertificateCsv(text: string): CertificateRecipient[] {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const firstCells = splitCsvLine(lines[0]);
  const looksLikeHeader =
    firstCells.length > 0 &&
    /^name$/i.test(firstCells[0].trim()) &&
    (firstCells.length === 1 || /^title$/i.test((firstCells[1] || "").trim()));

  const dataLines = looksLikeHeader ? lines.slice(1) : lines;
  const recipients: CertificateRecipient[] = [];
  const seen = new Set<string>();

  for (const line of dataLines) {
    const cells = splitCsvLine(line);
    const name = (cells[0] || "").trim();
    if (!name) continue;
    const title = (cells[1] || "").trim() || undefined;
    const key = `${name.toLowerCase()}|${(title || "").toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    recipients.push({ name, title });
  }

  return recipients;
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  cells.push(current);
  return cells;
}
