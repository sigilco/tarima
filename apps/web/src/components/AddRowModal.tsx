import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import * as v from "valibot";
import * as m from "../paraglide/messages.js";

/**
 * The manual add-row modal (stream: brief-to-board).
 *
 * The board's answer to "the row is not in the csv yet": a small form
 * with the fields the organizer actually knows (name, contact email,
 * channel, what is missing). It opens through the URL (`?add=open`),
 * same pattern as the csv modal, so the back button closes it.
 */

const CHANNELS = ["email", "telegram", "manual"] as const;

const nameSchema = v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(200));
const contactSchema = v.pipe(v.string(), v.trim(), v.email());

export function AddRowModal({
  projectId,
  filter,
  onAdd,
}: {
  projectId: string;
  filter: string;
  onAdd: (input: {
    name: string;
    contact?: string;
    channel?: "email" | "telegram" | "manual";
    missing?: string[];
  }) => void;
}) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [channel, setChannel] = useState<(typeof CHANNELS)[number]>("email");
  const [missing, setMissing] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const parsedName = v.safeParse(nameSchema, name);
    if (!parsedName.success) {
      setError(m["rowmodal.invalid"]());
      return;
    }
    const parsedContact = contact.trim() ? v.safeParse(contactSchema, contact) : null;
    if (parsedContact && !parsedContact.success) {
      setError(m["rowmodal.invalid"]());
      return;
    }
    setBusy(true);
    setError(null);
    try {
      onAdd({
        name: parsedName.output,
        ...(parsedContact ? { contact: parsedContact.output } : {}),
        channel,
        ...(missing.trim()
          ? {
              missing: missing
                .split(";")
                .map((item) => item.trim())
                .filter(Boolean),
            }
          : {}),
      });
      setDone(true);
      setName("");
      setContact("");
      setMissing("");
    } finally {
      setBusy(false);
    }
  }

  const FIELD =
    "mt-1.5 w-full rounded-xl border border-border-subtle bg-surface px-3.5 py-2.5 text-[15px] text-content outline-none placeholder:text-content-faint focus:border-content-faint";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-content/25 p-4 backdrop-blur-[2px] sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={m["rowmodal.title"]()}
        className="w-full max-w-md rounded-3xl border border-border-subtle bg-surface p-6 shadow-xl"
        data-testid="add-row-modal"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-2xl leading-tight text-content">
            {m["rowmodal.title"]()}
          </h2>
          <Link
            to="/app/p/$projectId"
            params={{ projectId }}
            search={{ filter, row: undefined, csv: undefined, add: undefined }}
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

        <form onSubmit={onSubmit}>
          <div className="mt-4">
            <label
              htmlFor="add-row-name"
              className="block text-[11px] font-medium uppercase tracking-[0.14em] text-content-faint"
            >
              {m["rowmodal.name"]()}
            </label>
            <input
              id="add-row-name"
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setDone(false);
              }}
              placeholder={m["rowmodal.namePlaceholder"]()}
              className={FIELD}
            />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="add-row-contact"
                className="block text-[11px] font-medium uppercase tracking-[0.14em] text-content-faint"
              >
                {m["rowmodal.contact"]()}
              </label>
              <input
                id="add-row-contact"
                type="email"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className={FIELD}
              />
            </div>
            <div>
              <label
                htmlFor="add-row-channel"
                className="block text-[11px] font-medium uppercase tracking-[0.14em] text-content-faint"
              >
                {m["rowmodal.channel"]()}
              </label>
              <select
                id="add-row-channel"
                value={channel}
                onChange={(e) => setChannel(e.target.value as (typeof CHANNELS)[number])}
                className={FIELD}
              >
                {CHANNELS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3">
            <label
              htmlFor="add-row-missing"
              className="block text-[11px] font-medium uppercase tracking-[0.14em] text-content-faint"
            >
              {m["rowmodal.missing"]()}
            </label>
            <input
              id="add-row-missing"
              type="text"
              value={missing}
              onChange={(e) => setMissing(e.target.value)}
              placeholder={m["rowmodal.missingPlaceholder"]()}
              className={FIELD}
            />
          </div>

          {error ? <p className="mt-3 text-[13px] text-danger">{error}</p> : null}
          {done ? <p className="mt-3 text-[13px] text-success">{m["rowmodal.added"]()}</p> : null}

          <button
            type="submit"
            disabled={busy}
            className="mt-5 w-full rounded-full bg-content px-5 py-3 text-[14px] font-medium text-surface transition-transform duration-300 ease-[cubic-bezier(0.34,1.4,0.4,1)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
          >
            {busy ? m["rowmodal.adding"]() : m["rowmodal.add"]()}
          </button>
        </form>
      </div>
    </div>
  );
}
