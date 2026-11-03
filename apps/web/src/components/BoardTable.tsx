import { Link } from "@tanstack/react-router";
import * as m from "../paraglide/messages.js";
import { bucketOf, relativeTime, type BoardRow } from "../lib/board";

/**
 * The board table (screens/board.md): one row per chased party, with the
 * name, the contact, the status, the missing deliverables and the last
 * activity.
 *
 * A row is a link: it carries the row id in the URL (`?row=<id>`), so
 * the detail modal opens without a second request and the back button
 * closes it.
 */

const STATUS_TONE: Record<string, string> = {
  candidate: "bg-warning-soft text-warning",
  chasing: "bg-accent-soft text-accent-strong",
  replied: "bg-success-soft text-success",
  blocked: "bg-danger-soft text-danger",
  done: "bg-surface-sunken text-content-muted",
};

export function BoardTable({
  projectId,
  rows,
  filter,
  emptyFiltered,
}: {
  projectId: string;
  rows: readonly BoardRow[];
  filter: string;
  emptyFiltered: boolean;
}) {
  if (rows.length === 0) {
    return (
      <p className="py-16 text-center text-[14px] text-content-muted">
        {emptyFiltered ? m["board.emptyFiltered"]() : m["board.empty"]()}
      </p>
    );
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
          {rows.map((row) => {
            const bucket = bucketOf(row.status);
            return (
              <tr key={row.id} className="border-b border-border-subtle/60 last:border-b-0">
                <td className="py-3.5 pr-4">
                  <Link
                    to="/app/p/$projectId"
                    params={{ projectId }}
                    search={{ filter, row: row.id, csv: undefined, add: undefined }}
                    className="inline-flex items-center gap-2 text-[14.5px] text-content transition-colors hover:text-accent-strong"
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-content-faint" />
                    <span className="font-medium">{row.name}</span>
                  </Link>
                </td>
                <td className="py-3.5 pr-4 text-[13.5px] text-content-muted">
                  {row.contact ?? m["row.needsContact"]()}
                </td>
                <td className="py-3.5 pr-4">
                  <span
                    data-testid={row.status === "candidate" ? "candidate-chip" : undefined}
                    className={`pill inline-block rounded-full px-2.5 py-1 text-[12px] ${
                      STATUS_TONE[bucket] ?? STATUS_TONE.chasing
                    }`}
                  >
                    {row.status === "candidate" ? m["stage.candidate"]() : row.status}
                  </span>
                </td>
                <td className="py-3.5 pr-4 text-[13.5px] text-content-muted">
                  {row.missing.length > 0 ? row.missing.join(", ") : m["board.noMissing"]()}
                </td>
                <td className="py-3.5 text-[13px] text-content-faint">
                  {relativeTime(row.updatedAt)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
