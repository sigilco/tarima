import { Link } from "@tanstack/react-router";
import * as m from "../paraglide/messages.js";
import type { BoardRow } from "../lib/board";

/**
 * The row modal (screens/row-modal.md): the detail of one board row.
 *
 * It opens through the URL (`?row=<entityId>`) and closes by dropping
 * that param, so the modal is shareable and the back button closes it.
 */

export function RowModal({
  projectId,
  row,
  filter,
}: {
  projectId: string;
  row: BoardRow;
  filter: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-content/25 p-4 backdrop-blur-[2px] sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={row.name}
        className="max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border-subtle bg-surface p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-2xl leading-tight text-content">{row.name}</h2>
          <Link
            to="/app/p/$projectId"
            params={{ projectId }}
            search={{ filter, row: undefined, csv: undefined }}
            aria-label={m["row.close"]()}
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

        <dl className="mt-5 grid grid-cols-3 gap-3 text-[13px]">
          <div>
            <dt className="text-content-faint">{m["row.contact"]()}</dt>
            <dd className="mt-1 text-content">{row.contact ?? m["board.noContact"]()}</dd>
          </div>
          <div>
            <dt className="text-content-faint">{m["row.channel"]()}</dt>
            <dd className="mt-1 text-content">{row.channel ?? m["board.noContact"]()}</dd>
          </div>
          <div>
            <dt className="text-content-faint">{m["row.status"]()}</dt>
            <dd className="mt-1 text-content">{row.status}</dd>
          </div>
        </dl>

        <div className="mt-6 border-t border-border-subtle pt-5">
          <h3 className="text-[11px] uppercase tracking-[0.14em] text-content-faint">
            {m["row.missing"]()}
          </h3>
          {row.missing.length > 0 ? (
            <ul className="mt-3 space-y-1.5">
              {row.missing.map((item) => (
                <li key={item} className="text-[14px] text-content">
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-[14px] text-content-muted">{m["row.noMissing"]()}</p>
          )}
        </div>
      </div>
    </div>
  );
}
