/**
 * CSV intake: parse an organizer-supplied CSV of entities into rows the
 * api can insert.
 *
 * Expected header: `name,contact,missing`
 *   - `name`    required, the entity name
 *   - `contact` optional, the contact email
 *   - `missing` optional, a `;`-separated list of missing deliverables
 *
 * The parser is deliberately tolerant: a broken row is reported in
 * `errors` and the rest of the batch still lands. A paste from a
 * spreadsheet must not be rejected as a whole because one cell is off.
 */
import Papa from "papaparse";

/** The most rows one intake call may create. */
export const CSV_MAX_ROWS = 500;

/** One parsed entity row, ready to insert. */
interface CsvEntity {
  name: string;
  contact?: string;
  missing: string[];
}

/** One rejected row, with the 1-based row number in the source file. */
interface CsvRowError {
  row: number;
  message: string;
}

/** The result of parsing a CSV document. */
export interface CsvParseResult {
  entities: CsvEntity[];
  errors: CsvRowError[];
}

/** The result of a parse, plus whether the document itself was unusable. */
export interface CsvParseDetailed extends CsvParseResult {
  /**
   * True when the document could not be read as a CSV of entities at all
   * (empty text, no header, missing the `name` column). Individual bad
   * rows never set this: they are reported in `errors` instead.
   */
  fatal: boolean;
}

/** The header columns the parser understands. */
const KNOWN_COLUMNS = ["name", "contact", "missing"] as const;

/** Longest accepted entity name. */
const MAX_NAME_LENGTH = 200;

/** Longest accepted contact value. */
const MAX_CONTACT_LENGTH = 320;

/** Longest accepted missing-item label. */
const MAX_ITEM_LENGTH = 200;

/**
 * The email pattern the intake accepts. Loose on purpose: the address is
 * stored as typed and a too-strict check would reject valid international
 * addresses.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Trim a cell and collapse its internal whitespace runs. */
function cell(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

/** The `missing` cell as a list: split on `;`, drop the empty entries. */
function parseMissing(value: unknown): string[] {
  return cell(value)
    .split(";")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .map((item) => item.slice(0, MAX_ITEM_LENGTH));
}

/** The header row, lowercased and trimmed, with the BOM stripped. */
function normalizeHeader(header: unknown): string[] {
  if (!Array.isArray(header)) return [];
  return header.map((column) =>
    cell(column)
      .replace(/^\uFEFF/, "")
      .toLowerCase(),
  );
}

/**
 * Parse a CSV document into entity rows.
 *
 * Rows beyond `CSV_MAX_ROWS` are dropped and reported as an error, so a
 * huge paste cannot flood the board.
 */
export function parseEntitiesCsv(csvText: string): CsvParseResult {
  return parseEntitiesCsvDetailed(csvText);
}

/** `parseEntitiesCsv` plus the `fatal` flag the route needs. */
export function parseEntitiesCsvDetailed(csvText: string): CsvParseDetailed {
  const entities: CsvEntity[] = [];
  const errors: CsvRowError[] = [];

  const text = typeof csvText === "string" ? csvText.replace(/^\uFEFF/, "") : "";
  if (text.trim().length === 0) {
    return { entities, errors: [{ row: 0, message: "csv is empty" }], fatal: true };
  }

  const parsed = Papa.parse<string[]>(text, {
    header: false,
    skipEmptyLines: "greedy",
    delimiter: ",",
  });

  const parseErrors = parsed.errors ?? [];
  if (parseErrors.length > 0) {
    for (const error of parseErrors) {
      errors.push({ row: error.row ?? 0, message: error.message });
    }
  }

  const rows = parsed.data ?? [];
  if (rows.length === 0) {
    errors.push({ row: 0, message: "csv has no rows" });
    return { entities, errors, fatal: true };
  }

  const header = normalizeHeader(rows[0]);
  if (header.length === 0 || !header.includes("name")) {
    errors.push({
      row: 1,
      message: `missing required column "name" (expected ${KNOWN_COLUMNS.join(",")})`,
    });
    return { entities, errors, fatal: true };
  }

  const nameIndex = header.indexOf("name");
  const contactIndex = header.indexOf("contact");
  const missingIndex = header.indexOf("missing");

  // Row numbers are 1-based over the whole file, so the header is row 1
  // and the first data row is row 2.
  let accepted = 0;
  let dropped = 0;
  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i] ?? [];
    const rowNumber = i + 1;

    const name = cell(row[nameIndex]);
    const contact = cell(row[contactIndex]);
    const missing = parseMissing(missingIndex >= 0 ? row[missingIndex] : "");

    // A completely blank row carries no information; skip it silently.
    if (name.length === 0 && contact.length === 0 && missing.length === 0) continue;

    if (name.length === 0) {
      errors.push({ row: rowNumber, message: "name is required" });
      continue;
    }
    if (name.length > MAX_NAME_LENGTH) {
      errors.push({ row: rowNumber, message: `name exceeds ${MAX_NAME_LENGTH} characters` });
      continue;
    }
    if (contact.length > MAX_CONTACT_LENGTH) {
      errors.push({ row: rowNumber, message: `contact exceeds ${MAX_CONTACT_LENGTH} characters` });
      continue;
    }
    if (contact.length > 0 && !EMAIL_RE.test(contact)) {
      errors.push({ row: rowNumber, message: `contact "${contact}" is not an email address` });
      continue;
    }

    // Past the cap the rows are dropped, but the first dropped row is
    // reported so the caller knows the batch was truncated.
    if (accepted >= CSV_MAX_ROWS) {
      dropped += 1;
      continue;
    }

    accepted += 1;
    entities.push(contact.length > 0 ? { name, contact, missing } : { name, missing });
  }

  if (dropped > 0) {
    errors.push({
      row: CSV_MAX_ROWS + 2,
      message: `batch exceeds the ${CSV_MAX_ROWS} row limit, ${dropped} row(s) dropped`,
    });
  }

  return { entities, errors, fatal: false };
}
