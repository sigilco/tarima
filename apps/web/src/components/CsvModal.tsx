import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import * as m from "../paraglide/messages.js";
import { previewCsv } from "../lib/csv-preview";
import type { BulkIntakeResult } from "../lib/api";

/**
 * The csv import modal (Stage 5, T5.2): paste or upload a csv, preview
 * what the server will do with it, then import.
 *
 * The preview is client-side (`lib/csv-preview.ts`): the same tolerant
 * reading the api applies, so what the organizer sees is what lands.
 * The import answer carries the server's own per-row errors, which are
 * shown after the call.
 */

export function CsvModal({
  projectId,
  filter,
  onImport,
  onClose,
}: {
  projectId: string;
  filter: string;
  onImport: (csv: string) => Promise<BulkIntakeResult>;
  onClose: () => void;
}) {
  const [csv, setCsv] = useState("");
  const [fileError, setFileError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<BulkIntakeResult | null>(null);
  const [failed, setFailed] = useState(false);

  const preview = csv.trim().length > 0 ? previewCsv(csv) : null;
  const goodRows = preview?.rows.filter((r) => !r.error).length ?? 0;
  const badRows = preview?.rows.filter((r) => r.error).length ?? 0;

  async function onUpload(file: File | undefined) {
    setFileError(false);
    if (!file) return;
    if (file.size > 1_000_000) {
      setFileError(true);
      return;
    }
    setCsv(await file.text());
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy || !preview || preview.fatal) return;
    setBusy(true);
    setFailed(false);
    try {
      setResult(await onImport(csv));
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-content/25 p-4 backdrop-blur-[2px] sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={m["csv.title"]()}
        className="max-h-[85dvh] w-full max-w-xl overflow-y-auto rounded-3xl border border-border-subtle bg-surface p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-2xl leading-tight text-content">{m["csv.title"]()}</h2>
          <Link
            to="/app/p/$projectId"
            params={{ projectId }}
            search={{ filter, row: undefined, csv: undefined }}
            aria-label={m["csv.close"]()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-raised text-content-muted transition-colors hover:text-content"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </Link>
        </div>

        <p className="mt-2 text-[13px] leading-relaxed text-content-muted">{m["csv.hint"]()}</p>

        {result ? (
          <div className="mt-5">
            <p className="text-[14px] text-success">
              {m["csv.imported"]({ count: String(result.created) })}
            </p>
            {result.errors.length > 0 ? (
              <ul className="mt-3 space-y-1 text-[13px] text-danger">
                {result.errors.map((error, i) => (
                  <li key={i}>
                    {m["csv.row"]()} {error.row}: {error.message}
                  </li>
                ))}
              </ul>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="mt-5 rounded-full bg-content px-5 py-2.5 text-[14px] font-medium text-surface"
            >
              {m["csv.close"]()}
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <textarea
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              placeholder={m["csv.pastePlaceholder"]()}
              rows={6}
              spellCheck={false}
              className="mt-4 w-full resize-y rounded-2xl border border-border-subtle bg-surface-raised px-4 py-3 font-mono text-[12.5px] leading-relaxed text-content outline-none placeholder:text-content-faint focus:border-content-faint"
            />

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <label className="cursor-pointer text-[13px] text-content-muted underline-offset-4 hover:text-content hover:underline">
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => onUpload(e.target.files?.[0])}
                />
                {m["csv.preview"]()}
              </label>
              {preview && !preview.fatal ? (
                <span className="text-[12.5px] text-content-muted">
                  {m["csv.rowCount"]({ count: String(goodRows), errors: String(badRows) })}
                </span>
              ) : null}
            </div>

            {fileError ? (
              <p className="mt-2 text-[13px] text-danger">{m["errors.offline"]()}</p>
            ) : null}
            {preview?.fatal ? (
              <p className="mt-2 text-[13px] text-danger">{m["csv.fatal"]()}</p>
            ) : null}
            {failed ? (
              <p className="mt-2 text-[13px] text-danger">{m["errors.offline"]()}</p>
            ) : null}

            {preview && !preview.fatal && preview.rows.length > 0 ? (
              <div className="mt-4 max-h-52 overflow-y-auto rounded-2xl border border-border-subtle">
                <table className="w-full text-left text-[12.5px]">
                  <thead>
                    <tr className="border-b border-border-subtle text-content-faint">
                      <th className="px-3 py-2 font-medium">#</th>
                      <th className="px-3 py-2 font-medium">{m["board.colName"]()}</th>
                      <th className="px-3 py-2 font-medium">{m["board.colContact"]()}</th>
                      <th className="px-3 py-2 font-medium">{m["board.colMissing"]()}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row) => (
                      <tr
                        key={row.row}
                        className={`border-b border-border-subtle/60 last:border-b-0 ${
                          row.error ? "text-danger" : "text-content"
                        }`}
                      >
                        <td className="px-3 py-2 text-content-faint">{row.row}</td>
                        <td className="px-3 py-2">{row.name || "—"}</td>
                        <td className="px-3 py-2">{row.contact || "—"}</td>
                        <td className="px-3 py-2">{row.missing.join(", ") || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={busy || !preview || preview.fatal || goodRows === 0}
              className="mt-5 w-full rounded-full bg-content px-5 py-3 text-[14px] font-medium text-surface transition-transform duration-300 ease-[cubic-bezier(0.34,1.4,0.4,1)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
            >
              {busy ? m["csv.importing"]() : m["csv.import"]()}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
