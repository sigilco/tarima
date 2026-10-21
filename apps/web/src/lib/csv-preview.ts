/**
 * Client-side csv preview (Stage 5, T5.2): the same tolerant reading the
 * api's parser applies, so what the import modal previews is what the
 * server will do with the paste.
 *
 * The rules are the api's (`apps/api/src/services/csv-intake.ts`):
 * header `name,contact,missing`, `missing` split on `;`, a bad row is
 * reported and the rest still lands. Mirrored here rather than shared
 * because the web app cannot import from apps/api; the api stays the
 * source of truth and its per-row errors are shown after the call.
 */

/** The most rows one intake call may create (mirror of the api cap). */
export const CSV_MAX_ROWS = 500;

/** One parsed preview row. */
export interface PreviewRow {
  row: number;
  name: string;
  contact: string;
  missing: string[];
  error?: string;
}

/** The result of a preview parse. */
export interface PreviewResult {
  rows: PreviewRow[];
  /** True when the document is not a csv of entities at all. */
  fatal: boolean;
  /** First fatal error message, when `fatal` is true. */
  message?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cell(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function parseMissing(value: unknown): string[] {
  return cell(value)
    .split(";")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

/** Split a csv line the way the api does: quotes-aware, comma-delimited. */
function splitLine(line: string): string[] {
  const out: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      out.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  out.push(current);
  return out;
}

/**
 * Parse a pasted csv into preview rows. Never throws: a document that is
 * not a csv of entities answers `fatal` with a message.
 */
export function previewCsv(text: string): PreviewResult {
  const clean = (typeof text === "string" ? text : "").replace(/^\uFEFF/, "");
  if (clean.trim().length === 0) {
    return { rows: [], fatal: true, message: "empty" };
  }

  const lines = clean.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    return { rows: [], fatal: true, message: "empty" };
  }

  const header = splitLine(lines[0] ?? "").map((column) => cell(column).toLowerCase());
  if (!header.includes("name")) {
    return { rows: [], fatal: true, message: "missing-name-column" };
  }

  const nameIndex = header.indexOf("name");
  const contactIndex = header.indexOf("contact");
  const missingIndex = header.indexOf("missing");

  const rows: PreviewRow[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const line = splitLine(lines[i] ?? "");
    const rowNumber = i + 1;

    const name = cell(line[nameIndex]);
    const contact = cell(line[contactIndex >= 0 ? contactIndex : -1] ?? "");
    const missing = parseMissing(missingIndex >= 0 ? line[missingIndex] : "");

    if (name.length === 0 && contact.length === 0 && missing.length === 0) continue;

    let error: string | undefined;
    if (name.length === 0) error = "name-required";
    else if (contact.length > 0 && !EMAIL_RE.test(contact)) error = "contact-not-email";
    else if (rows.filter((r) => !r.error).length >= CSV_MAX_ROWS) error = "row-limit";

    rows.push({ row: rowNumber, name, contact, missing, ...(error ? { error } : {}) });
  }

  if (rows.length === 0) {
    return { rows: [], fatal: false, message: "no-data-rows" };
  }
  return { rows, fatal: false };
}
