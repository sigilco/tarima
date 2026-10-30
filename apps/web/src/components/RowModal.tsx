import { useState } from "react";
import { Link } from "@tanstack/react-router";
import * as m from "../paraglide/messages.js";
import { setRowContact } from "../lib/api";
import type { BoardRow } from "../lib/board";

/**
 * The row modal (screens/row-modal.md): the detail of one board row.
 *
 * It opens through the URL (`?row=<entityId>`) and closes by dropping
 * that param, so the modal is shareable and the back button closes it.
 *
 * The contact affordance: a curated venue without an email (OSM rarely
 * carries one) shows an entry field here. Saving it clears the row's
 * "no contact" flag, so the chase can reach the venue.
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
  const [editingContact, setEditingContact] = useState(false);
  const [contactValue, setContactValue] = useState("");
  const [contactError, setContactError] = useState<string | null>(null);
  const needsContact = !row.contact;

  async function saveContact() {
    const contact = contactValue.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) {
      setContactError(m["row.contactInvalid"]());
      return;
    }
    setContactError(null);
    try {
      await setRowContact(projectId, row.id, contact);
      setEditingContact(false);
    } catch {
      setContactError(m["errors.offline"]());
    }
  }

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
            search={{ filter, row: undefined, csv: undefined, add: undefined }}
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
            {needsContact ? (
              <button
                type="button"
                onClick={() => setEditingContact(true)}
                className="mt-1 text-[12px] text-accent-strong underline underline-offset-2"
              >
                {m["row.addContact"]()}
              </button>
            ) : null}
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

        {needsContact ? (
          <p className="mt-3 rounded-2xl bg-warning-soft px-4 py-2.5 text-[13px] text-warning">
            {m["row.needsContact"]()}
          </p>
        ) : null}

        {editingContact ? (
          <form
            className="mt-4 flex flex-col gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void saveContact();
            }}
          >
            <input
              type="email"
              value={contactValue}
              onChange={(event) => setContactValue(event.target.value)}
              placeholder={m["row.contactPlaceholder"]()}
              aria-label={m["row.contact"]()}
              className="rounded-2xl border border-border-subtle bg-surface-raised px-4 py-2.5 text-[14px] text-content outline-none focus:border-accent"
            />
            {contactError ? <p className="text-[12px] text-danger">{contactError}</p> : null}
            <button
              type="submit"
              className="self-start rounded-full bg-content px-4 py-2 text-[13px] font-medium text-surface"
            >
              {m["row.addContact"]()}
            </button>
          </form>
        ) : null}

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
