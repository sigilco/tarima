import { useState, type FormEvent } from "react";
import * as m from "../../../paraglide/messages.js";
import { ArrowRightIcon, CheckCircleIcon } from "./icons";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type WaitlistFormProps = {
  /** Target endpoint for access requests. Defaults to /api/access-requests. */
  endpoint?: string;
  className?: string;
};

type FormStatus = "idle" | "submitting" | "success" | "error";

export function WaitlistForm({
  endpoint = "/api/access-requests",
  className = "",
}: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [intent, setIntent] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const cleanEmail = email.trim();

    if (!cleanEmail || !EMAIL_RE.test(cleanEmail)) {
      setStatus("error");
      setErrorMessage(m["playful.waitlist.validationMessage"]());
      return;
    }

    setStatus("submitting");
    setErrorMessage(null);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          ...(intent ? { intent } : {}),
        }),
      });

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(m["playful.waitlist.errorMessage"]());
        return;
      }

      setStatus("success");
      setEmail("");
      setIntent("");
    } catch {
      setStatus("error");
      setErrorMessage(m["playful.waitlist.errorMessage"]());
    }
  }

  const isInvalid = status === "error";
  const fallbackMailto = email.trim()
    ? `mailto:hello@tarima.app?subject=${encodeURIComponent("Tarima early access: " + email.trim())}`
    : "mailto:hello@tarima.app?subject=Tarima%20early%20access";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={`w-full max-w-xl text-left ${className}`}
      aria-label={m["playful.waitlist.title"]()}
    >
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        {/* Email input */}
        <div className="relative flex-1">
          <label htmlFor="waitlist-email" className="sr-only">
            {m["playful.waitlist.emailLabel"]()}
          </label>
          <input
            id="waitlist-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (status === "error" || status === "success") {
                setStatus("idle");
                setErrorMessage(null);
              }
            }}
            placeholder={m["playful.waitlist.emailPlaceholder"]()}
            aria-describedby="waitlist-status"
            aria-invalid={isInvalid}
            className={`w-full rounded-xl border bg-white px-3.5 py-3 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 transition-colors focus:outline-none focus:ring-2 ${
              isInvalid
                ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                : "border-neutral-200 focus:border-neutral-900 focus:ring-neutral-900/10"
            }`}
          />
        </div>

        {/* Optional Intent / Role select */}
        <div className="relative sm:w-44">
          <label htmlFor="waitlist-intent" className="sr-only">
            {m["playful.waitlist.intentLabel"]()}
          </label>
          <select
            id="waitlist-intent"
            name="intent"
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm text-neutral-800 shadow-sm transition-colors focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
          >
            <option value="">{m["playful.waitlist.intentOptionPlaceholder"]()}</option>
            <option value="organizer">{m["playful.waitlist.intentOptionOrganizer"]()}</option>
            <option value="sponsor">{m["playful.waitlist.intentOptionSponsor"]()}</option>
            <option value="venue">{m["playful.waitlist.intentOptionVenue"]()}</option>
            <option value="other">{m["playful.waitlist.intentOptionOther"]()}</option>
          </select>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={status === "submitting"}
          className="flex w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-neutral-800 active:scale-[0.98] disabled:opacity-60 sm:w-auto"
        >
          <span>
            {status === "submitting"
              ? m["playful.waitlist.submittingLabel"]()
              : m["playful.waitlist.submitLabel"]()}
          </span>
          <ArrowRightIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Reserved status line to eliminate layout shift */}
      <div
        id="waitlist-status"
        role="status"
        aria-live="polite"
        className="mt-2 flex min-h-[1.5rem] items-center text-xs"
      >
        {status === "success" && (
          <div className="flex items-center gap-1.5 font-medium text-emerald-700">
            <CheckCircleIcon className="h-4 w-4 text-emerald-600" />
            <span>{m["playful.waitlist.successMessage"]()}</span>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-wrap items-center gap-2 text-neutral-800">
            <span className="font-medium text-red-600">
              {errorMessage || m["playful.waitlist.errorMessage"]()}
            </span>
            <a
              href={fallbackMailto}
              className="font-semibold text-neutral-900 underline hover:text-black"
            >
              {m["playful.waitlist.fallbackLabel"]()} &rarr;
            </a>
          </div>
        )}
      </div>
    </form>
  );
}
