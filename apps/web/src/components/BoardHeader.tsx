import { Link } from "@tanstack/react-router";
import * as m from "../paraglide/messages.js";
import type { BucketCount } from "../lib/board";

/**
 * The board header (screens/board.md): the project name, the status
 * count chips and the live indicator.
 *
 * The chips are links: a chip carries the filter in the URL, so the
 * board state is shareable and the back button steps through the
 * filters.
 */

/** The label of a bucket chip, kept out of the template string so the
 * paraglide keys stay statically typed. */
const CHIP_LABEL: Record<string, (count: number) => string> = {
  chasing: (count) => m["board.chasing.n"]({ count: String(count) }),
  replied: (count) => m["board.replied.n"]({ count: String(count) }),
  blocked: (count) => m["board.blocked.n"]({ count: String(count) }),
  done: (count) => m["board.done.n"]({ count: String(count) }),
};

export function BoardHeader({
  projectId,
  projectName,
  briefLine,
  buckets,
  live,
  onImport,
  onAddRow,
}: {
  projectId: string;
  projectName: string;
  briefLine?: string;
  buckets: readonly BucketCount[];
  live: "connecting" | "live" | "down";
  onImport: () => void;
  onAddRow: () => void;
}) {
  const liveLabel =
    live === "live"
      ? m["board.live"]()
      : live === "down"
        ? m["board.down"]()
        : m["board.connecting"]();

  return (
    <header className="border-b border-border-subtle">
      <div className="flex flex-wrap items-center justify-between gap-4 py-5">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/app"
            className="flex items-center gap-2 text-[13px] text-content-muted transition-colors hover:text-content"
          >
            <img src="/mark.png" alt="" className="h-5 w-5 rounded-[5px]" />
            {m["app.backToProjects"]()}
          </Link>
          <span className="text-content-faint">/</span>
          <h1 className="truncate font-display text-2xl leading-tight text-content">
            {projectName}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-2 text-[12px] ${
              live === "live"
                ? "text-success"
                : live === "down"
                  ? "text-danger"
                  : "text-content-faint"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                live === "live" ? "bg-success" : live === "down" ? "bg-danger" : "bg-content-faint"
              }`}
            />
            {liveLabel}
          </span>
          <button
            type="button"
            onClick={onAddRow}
            className="rounded-full border border-border-subtle px-4 py-2 text-[13px] font-medium text-content transition-colors hover:bg-surface-raised"
          >
            {m["board.addRow"]()}
          </button>
          <button
            type="button"
            onClick={onImport}
            className="rounded-full border border-border-subtle px-4 py-2 text-[13px] font-medium text-content transition-colors hover:bg-surface-raised"
          >
            {m["board.importCsv"]()}
          </button>
        </div>
      </div>

      {briefLine ? (
        <p className="pb-3 text-[13px] leading-relaxed text-content-muted">
          <span className="mr-2 text-[10px] font-medium uppercase tracking-[0.16em] text-content-faint">
            {m["board.briefLabel"]()}
          </span>
          {briefLine}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 pb-5">
        {buckets.map(({ bucket, count }) => (
          <Link
            key={bucket}
            to="/app/p/$projectId"
            params={{ projectId }}
            search={{ filter: bucket, row: undefined, csv: undefined, add: undefined }}
            className="rounded-full bg-surface-raised px-3.5 py-1.5 text-[12.5px] text-content-muted ring-1 ring-border-subtle transition-colors hover:text-content"
          >
            {CHIP_LABEL[bucket]?.(count) ?? `${bucket} ${count}`}
          </Link>
        ))}
      </div>
    </header>
  );
}
