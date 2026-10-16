/**
 * Prefer the user's original upload name so downloads don't need renaming.
 */
export function keepOriginalName(
  source: File | string | null | undefined,
  fallback: string,
  forceExt?: string,
): string {
  let name =
    typeof source === "string"
      ? source
      : source?.name?.trim() || fallback;

  name = name.replace(/\\/g, "/");
  const slash = name.lastIndexOf("/");
  if (slash >= 0) name = name.slice(slash + 1);
  name = name.replace(/[\r\n"\\]/g, "_").trim() || fallback;

  if (forceExt) {
    const ext = forceExt.startsWith(".") ? forceExt.toLowerCase() : `.${forceExt.toLowerCase()}`;
    const dot = name.lastIndexOf(".");
    name = (dot > 0 ? name.slice(0, dot) : name) + ext;
  }
  return name;
}

export function filenameFromContentDisposition(header: string | null): string | null {
  if (!header) return null;
  const star = /filename\*=(?:UTF-8''|utf-8'')([^;]+)/i.exec(header);
  if (star?.[1]) {
    try {
      return decodeURIComponent(star[1].trim().replace(/^"|"$/g, ""));
    } catch {
      return star[1].trim().replace(/^"|"$/g, "");
    }
  }
  const plain = /filename="((?:\\.|[^"])*)"|filename=([^;]+)/i.exec(header);
  if (!plain) return null;
  const raw = (plain[1] ?? plain[2] ?? "").trim().replace(/^"|"$/g, "");
  return raw || null;
}
