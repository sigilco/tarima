import * as m from "../paraglide/messages.js";
import type { BriefFormValues } from "../lib/brief";

/**
 * The brief fields (stream: brief-to-board).
 *
 * Five structured fields (type, city, date, headcount, budget) plus free
 * text notes. The values are validated with the contract's `briefSchema`
 * in `lib/brief.ts` before the project is created, so the browser never
 * sends a brief the api would reject.
 *
 * The fields live inside the new-project form, so there is one button:
 * the organizer fills the brief and creates the project in one go.
 */

const FIELD_CLASS =
  "mt-1.5 w-full rounded-xl border border-border-subtle bg-surface px-3.5 py-2.5 text-[15px] text-content outline-none placeholder:text-content-faint focus:border-content-faint";

function Label({ children, htmlFor }: { children: string; htmlFor: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-[11px] font-medium uppercase tracking-[0.14em] text-content-faint"
    >
      {children}
    </label>
  );
}

export function BriefForm({
  values,
  onChange,
}: {
  values: BriefFormValues;
  onChange: (values: BriefFormValues) => void;
}) {
  function set<K extends keyof BriefFormValues>(key: K, value: BriefFormValues[K]) {
    onChange({ ...values, [key]: value });
  }

  return (
    <div className="mt-8 rounded-2xl border border-border-subtle bg-surface-raised p-5">
      <h2 className="font-display text-xl leading-tight text-content">{m["brief.title"]()}</h2>
      <p className="mt-1.5 text-[13.5px] text-content-muted">{m["brief.sub"]()}</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="brief-event-type">{m["brief.eventType"]()}</Label>
          <input
            id="brief-event-type"
            type="text"
            required
            value={values.eventType}
            onChange={(e) => set("eventType", e.target.value)}
            placeholder={m["brief.eventTypePlaceholder"]()}
            className={FIELD_CLASS}
          />
        </div>
        <div>
          <Label htmlFor="brief-city">{m["brief.city"]()}</Label>
          <input
            id="brief-city"
            type="text"
            required
            value={values.city}
            onChange={(e) => set("city", e.target.value)}
            placeholder={m["brief.cityPlaceholder"]()}
            className={FIELD_CLASS}
          />
        </div>
        <div>
          <Label htmlFor="brief-date">{`${m["brief.date"]()} (${m["brief.optional"]()})`}</Label>
          <input
            id="brief-date"
            type="date"
            value={values.date}
            onChange={(e) => set("date", e.target.value)}
            className={FIELD_CLASS}
          />
        </div>
        <div>
          <Label htmlFor="brief-headcount">{m["brief.headcount"]()}</Label>
          <input
            id="brief-headcount"
            type="number"
            inputMode="numeric"
            min={1}
            required
            value={values.headcount}
            onChange={(e) => set("headcount", e.target.value)}
            className={FIELD_CLASS}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="brief-budget">{m["brief.budget"]()}</Label>
          <div className="flex gap-2">
            <input
              id="brief-budget"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              required
              value={values.budgetAmount}
              onChange={(e) => set("budgetAmount", e.target.value)}
              className={`${FIELD_CLASS} mt-0`}
            />
            <input
              type="text"
              aria-label={m["brief.currency"]()}
              maxLength={3}
              value={values.currency}
              onChange={(e) => set("currency", e.target.value)}
              className={`${FIELD_CLASS} mt-0 w-24 shrink-0 uppercase`}
            />
          </div>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="brief-notes">{`${m["brief.notes"]()} (${m["brief.optional"]()})`}</Label>
          <textarea
            id="brief-notes"
            rows={3}
            value={values.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder={m["brief.notesPlaceholder"]()}
            className={`${FIELD_CLASS} resize-y`}
          />
        </div>
      </div>
    </div>
  );
}
