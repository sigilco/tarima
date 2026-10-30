/**
 * Brief form logic (streams: brief-to-board).
 *
 * Pure helpers over the brief form fields, so the component stays thin
 * and the rules are testable in plain node (see brief.test.ts). The
 * shape is the contract's `briefSchema`; this module owns the form-side
 * translation (strings in, numbers and dates out).
 */
import * as v from "valibot";
import { briefSchema, type Brief } from "@tarima/contract";

/** The raw fields the form holds: everything is a string. */
export interface BriefFormValues {
  eventType: string;
  city: string;
  date: string;
  headcount: string;
  budgetAmount: string;
  currency: string;
  notes: string;
}

export const EMPTY_BRIEF_FORM: BriefFormValues = {
  eventType: "",
  city: "",
  date: "",
  headcount: "",
  budgetAmount: "",
  currency: "EUR",
  notes: "",
};

/** Parse the raw form values into a contract `Brief`, or undefined. */
export function parseBriefForm(values: BriefFormValues): Brief | undefined {
  const headcount = Number.parseInt(values.headcount, 10);
  const budgetAmount = Number.parseFloat(values.budgetAmount.replace(",", "."));
  const parsed = v.safeParse(
    briefSchema,
    clean({
      eventType: values.eventType,
      city: values.city,
      ...(values.date ? { date: values.date } : {}),
      headcount,
      budgetAmount,
      currency: values.currency.trim().toUpperCase(),
      ...(values.notes.trim() ? { notes: values.notes.trim() } : {}),
    }),
  );
  return parsed.success ? parsed.output : undefined;
}

/** Drop undefined values so valibot sees absent keys, not undefined ones. */
function clean(record: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}

/** Prefill the form from an existing brief (round-trip back into the form). */
export function briefToForm(brief: Brief): BriefFormValues {
  return {
    eventType: brief.eventType,
    city: brief.city,
    date: brief.date ?? "",
    headcount: String(brief.headcount),
    budgetAmount: String(brief.budgetAmount),
    currency: brief.currency,
    notes: brief.notes ?? "",
  };
}
