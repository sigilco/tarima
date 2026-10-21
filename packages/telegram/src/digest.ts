/**
 * Digest rendering.
 *
 * `digestForProject` is a pure function: same input, same message, byte
 * for byte. That makes the digest testable without Telegram and lets the
 * api preview a digest before it is pushed.
 *
 * The output is plain text (no `parse_mode`), so no markdown escaping is
 * needed. Telegram renders it as a monospace-ish plain message; newlines
 * are the only structure, so every value is collapsed to a single line.
 */
import type { DigestInput, DigestRow, DigestTotals } from "./types.js";

/** How many rows a digest carries before it truncates. */
export const DIGEST_MAX_ROWS = 10;

/** Longest name kept in a digest row before it is cut. */
const MAX_NAME_LENGTH = 80;

/** Longest missing-item label kept in a digest row before it is cut. */
const MAX_ITEM_LENGTH = 60;

/**
 * Severity ranking of the row states, most urgent first. The states are
 * the contract's chase row states (see `@tarima/contract`); unknown states
 * sort last so a newer state never reorders the whole digest.
 */
const SEVERITY: Record<string, number> = {
  blocked: 0,
  chasing: 1,
  outreach: 1,
  notifying: 1,
  awaiting_reply: 2,
  parsing: 2,
  validating: 2,
  updating: 2,
  replied: 3,
  done: 3,
  intake: 4,
};

const UNKNOWN_SEVERITY = 5;

/** Collapse every whitespace run into a single space and trim. */
function oneLine(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/** Cut a value to `max` characters, appending an ellipsis marker. */
function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 1)).trimEnd()}...`;
}

/** The severity rank of a row state; unknown states rank last. */
function severityOf(status: string): number {
  return SEVERITY[status] ?? UNKNOWN_SEVERITY;
}

/**
 * Compare two rows: severity first, then name, then status. The
 * comparison is locale independent so the order does not depend on the
 * machine locale.
 */
function compareRows(a: DigestRow, b: DigestRow): number {
  const bySeverity = severityOf(a.status) - severityOf(b.status);
  if (bySeverity !== 0) return bySeverity;
  const byName = a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
  if (byName !== 0) return byName;
  return a.status < b.status ? -1 : a.status > b.status ? 1 : 0;
}

/** The counts line: `done: 3 | chasing: 2 | awaiting: 1 | blocked: 0 | total: 6`. */
function countsLine(totals: DigestTotals): string {
  const total = totals.total ?? 0;
  return [
    `done: ${totals.done ?? 0}`,
    `chasing: ${totals.chasing ?? 0}`,
    `awaiting: ${totals.awaiting ?? 0}`,
    `blocked: ${totals.blocked ?? 0}`,
    `total: ${total}`,
  ].join(" | ");
}

/** One row line: `- name [status] missing: a, b`. */
function rowLine(row: DigestRow): string {
  const name = truncate(oneLine(row.name), MAX_NAME_LENGTH);
  const status = oneLine(row.status).toLowerCase();
  const missing = (row.missing ?? [])
    .map((item) => truncate(oneLine(item), MAX_ITEM_LENGTH))
    .filter((item) => item.length > 0);

  let line = `- ${name} [${status}]`;
  if (missing.length > 0) line += ` missing: ${missing.join(", ")}`;
  return line;
}

/**
 * Render the digest message of a project.
 *
 * Layout: project name, per-status counts, then up to `DIGEST_MAX_ROWS`
 * rows ordered by severity and name. When rows are dropped, a trailing
 * line says how many.
 */
export function digestForProject(input: DigestInput): string {
  const lines: string[] = [];

  lines.push(`Project: ${truncate(oneLine(input.projectName), MAX_NAME_LENGTH)}`);
  lines.push(countsLine(input.totals));

  // Copy before sorting: the input array is the caller's and must not move.
  const rows = (input.rows ?? []).toSorted(compareRows);
  for (const row of rows.slice(0, DIGEST_MAX_ROWS)) {
    lines.push(rowLine(row));
  }
  const dropped = rows.length - Math.min(rows.length, DIGEST_MAX_ROWS);
  if (dropped > 0) {
    lines.push(`... ${dropped} more row(s)`);
  }

  return lines.join("\n");
}
