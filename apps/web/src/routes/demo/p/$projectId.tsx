import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import * as m from "../../../paraglide/messages.js";
import { relativeTime, sortRows, type BoardRow } from "../../../lib/board";
import { DEMO_NOW, DEMO_PROJECT, DEMO_ROWS } from "../../../lib/demo-fixtures";
import { StatusPill } from "../-StatusPill";

/**
 * /demo/p/$projectId (T7): the detail view of the demo project — the
 * fixture row list plus the detail of one row (via `?row=`). Read-only;
 * a projectId that is not the demo project renders a "not found" state.
 */

const searchSchema = (search: Record<string, unknown>) => ({
  row: typeof search.row === "string" ? search.row : undefined,
});

export const Route = createFileRoute("/demo/p/$projectId")({
  validateSearch: searchSchema,
  component: DemoProject,
});

function RowDetail({ row }: { row: BoardRow }) {
  return (
    <div className="mt-8 rounded-[24px] border border-border-subtle bg-surface-raised p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl text-content">{row.name}</h2>
        <StatusPill status={row.status} />
      </div>
      <dl className="mt-4 grid gap-3 text-[13.5px] sm:grid-cols-2">
        <div>
          <dt className="text-content-faint">{m["board.colContact"]()}</dt>
          <dd className="text-content-muted">{row.contact ?? m["board.noContact"]()}</dd>
        </div>
        <div>
          <dt className="text-content-faint">{m["board.colMissing"]()}</dt>
          <dd className="text-content-muted">
            {row.missing.length > 0 ? row.missing.join(", ") : m["board.noMissing"]()}
          </dd>
        </div>
        <div>
          <dt className="text-content-faint">{m["board.colUpdated"]()}</dt>
          <dd className="text-content-muted">
            {new Date(row.updatedAt).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function DemoProject() {
  const { projectId } = useParams({ from: "/demo/p/$projectId" });
  const search = Route.useSearch();

  if (projectId !== DEMO_PROJECT.id) {
    return (
      <main className="grain flex min-h-[100dvh] items-center justify-center bg-surface px-5 text-content">
        <div className="text-center">
          <p className="font-display text-3xl text-content">No demo project here</p>
          <p className="mt-3 text-[14px] text-content-muted">
            The demo only ships one sample project. Head back and pick a row from it.
          </p>
          <Link
            to="/demo"
            className="mt-6 inline-block rounded-full border border-border-subtle px-4 py-2 text-[13px] font-medium text-content transition-colors hover:bg-surface-raised"
          >
            Back to the demo
          </Link>
        </div>
      </main>
    );
  }

  const rows = sortRows(DEMO_ROWS);
  const selected = rows.find((row) => row.id === search.row) ?? null;

  return (
    <main className="grain min-h-[100dvh] bg-surface px-5 py-10 text-content lg:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="border-b border-border-subtle">
          <div className="flex flex-wrap items-center justify-between gap-4 py-5">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                to="/demo"
                className="flex items-center gap-2 text-[13px] text-content-muted transition-colors hover:text-content"
              >
                <span aria-hidden>←</span> Back to the demo
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
        </header>

        {selected ? <RowDetail row={selected} /> : null}

        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-border-subtle text-[11px] uppercase tracking-[0.14em] text-content-faint">
                <th className="py-3 pr-4 font-medium">{m["board.colName"]()}</th>
                <th className="py-3 pr-4 font-medium">{m["board.colStatus"]()}</th>
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
                      className="text-[14.5px] font-medium text-content transition-colors hover:text-accent-strong"
                    >
                      {row.name}
                    </Link>
                  </td>
                  <td className="py-3.5 pr-4">
                    <StatusPill status={row.status} />
                  </td>
                  <td className="py-3.5 text-[13px] text-content-faint">
                    {relativeTime(row.updatedAt, DEMO_NOW)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
