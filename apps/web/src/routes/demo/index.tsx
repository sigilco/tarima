import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import * as m from "../../paraglide/messages.js";
import { boardView, relativeTime, type BoardBucket, type BoardRow } from "../../lib/board";
import { DEMO_NOW, DEMO_PROJECT, DEMO_ROWS } from "../../lib/demo-fixtures";
import { StatusPill } from "./-StatusPill";

/**
 * /demo (T7): a read-only marketing preview of the board, rendered over
 * fixture data (`lib/demo-fixtures.ts`). No api calls, no auth: the
 * pipeline in `lib/board.ts` runs on plain data, so the table is a local
 * presentational copy of BoardTable with the links retargeted to /demo.
 */

export const Route = createFileRoute("/demo/")({
  component: DemoHome,
});

const CHIP_LABEL: Record<BoardBucket, string> = {
  chasing: "Chasing",
  replied: "Replied",
  blocked: "Blocked",
  done: "Done",
};

function DemoTable({ rows }: { rows: readonly BoardRow[] }) {
  if (rows.length === 0) {
    return <p className="py-16 text-center text-[14px] text-content-muted">{m["board.empty"]()}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[42rem] border-collapse text-left">
        <thead>
          <tr className="border-b border-border-subtle text-[11px] uppercase tracking-[0.14em] text-content-faint">
            <th className="py-3 pr-4 font-medium">{m["board.colName"]()}</th>
            <th className="py-3 pr-4 font-medium">{m["board.colContact"]()}</th>
            <th className="py-3 pr-4 font-medium">{m["board.colStatus"]()}</th>
            <th className="py-3 pr-4 font-medium">{m["board.colMissing"]()}</th>
            <th className="py-3 font-medium">{m["board.colUpdated"]()}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-border-subtle/60 last:border-b-0">
              <td className="py-3.5 pr-4">
                <Link
                  to="/demo/p/$projectId"
                  params={{ projectId: DEMO_PROJECT.id }}
                  search={{ row: row.id }}
                  className="inline-flex items-center gap-2 text-[14.5px] text-content transition-colors hover:text-accent-strong"
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-content-faint" />
                  <span className="font-medium">{row.name}</span>
                </Link>
              </td>
              <td className="py-3.5 pr-4 text-[13.5px] text-content-muted">
                {row.contact ?? m["board.noContact"]()}
              </td>
              <td className="py-3.5 pr-4">
                <StatusPill status={row.status} />
              </td>
              <td className="py-3.5 pr-4 text-[13.5px] text-content-muted">
                {row.missing.length > 0 ? row.missing.join(", ") : m["board.noMissing"]()}
              </td>
              <td className="py-3.5 text-[13px] text-content-faint">
                {relativeTime(row.updatedAt, DEMO_NOW)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DemoHome() {
  const [filter, setFilter] = useState<BoardBucket | "all">("all");
  const { visible, buckets } = boardView(DEMO_ROWS, filter);

  return (
    <main className="grain min-h-[100dvh] bg-surface px-5 py-10 text-content lg:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="border-b border-border-subtle">
          <div className="flex flex-wrap items-center justify-between gap-4 py-5">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                to="/"
                className="flex items-center gap-2 text-[13px] text-content-muted transition-colors hover:text-content"
              >
                <img src="/mark.png" alt="" className="h-5 w-5 rounded-[5px]" />
                Tarima
              </Link>
              <span className="text-content-faint">/</span>
              <h1 className="truncate font-display text-2xl leading-tight text-content">
                {DEMO_PROJECT.name}
              </h1>
            </div>
            <span className="inline-flex items-center gap-2 text-[12px] text-content-faint">
              <span className="h-1.5 w-1.5 rounded-full bg-content-faint" />
              Live demo — sample data
            </span>
          </div>

          <p className="pb-5 text-[13px] text-content-muted">
            A fictional conference ("Summit 2026") chased by a demo agent. This board is read-only;
            the real product works the same way, live.
          </p>

          <div className="flex flex-wrap items-center gap-2 pb-5">
            {(["all", ...buckets.map(({ bucket }) => bucket)] as const).map((bucket) => {
              const count =
                bucket === "all"
                  ? DEMO_ROWS.length
                  : (buckets.find((b) => b.bucket === bucket)?.count ?? 0);
              return (
                <button
                  key={bucket}
                  type="button"
                  onClick={() => setFilter(bucket)}
                  className={`rounded-full px-3.5 py-1.5 text-[12.5px] transition-colors ${
                    filter === bucket
                      ? "bg-content text-surface"
                      : "bg-surface-raised text-content-muted ring-1 ring-border-subtle hover:text-content"
                  }`}
                >
                  {bucket === "all" ? `All ${count}` : `${CHIP_LABEL[bucket]} ${count}`}
                </button>
              );
            })}
          </div>
        </header>

        <DemoTable rows={visible} />

        <footer className="mt-10 flex items-center justify-between border-t border-border-subtle pt-6">
          <p className="text-[13px] text-content-muted">Want this for your own event?</p>
          <Link
            to="/login"
            search={{ step: "email", email: "" }}
            className="rounded-full border border-border-subtle px-4 py-2 text-[13px] font-medium text-content transition-colors hover:bg-surface-raised"
          >
            Start free
          </Link>
        </footer>
      </div>
    </main>
  );
}
