import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import * as v from "valibot";
import * as m from "../paraglide/messages.js";

/**
 * /login (Stage 5, T5.2): the two-step email -> code flow of login.md.
 *
 * The step lives in the URL (`?step=email|code&email=…`) so a refresh or
 * a shared link lands on the same step; validateSearch parses and clamps
 * it. On success the api sets the `tarima_session` cookie and the route
 * redirects to /app.
 */

const emailSchema = v.pipe(v.string(), v.trim(), v.email());
const codeSchema = v.pipe(v.string(), v.regex(/^\d{6}$/));

const searchSchema = v.object({
  step: v.optional(v.picklist(["email", "code"]), "email"),
  email: v.optional(v.pipe(v.string(), v.maxLength(320)), ""),
});

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => {
    const parsed = v.safeParse(searchSchema, {
      step: typeof search.step === "string" ? search.step : undefined,
      email: typeof search.email === "string" ? search.email : undefined,
    });
    return parsed.success ? parsed.output : { step: "email" as const, email: "" };
  },
  beforeLoad: ({ search }) => {
    // The code step is only reachable with an email in the URL.
    if (search.step === "code" && !search.email) {
      throw redirect({ to: "/login", search: { step: "email", email: "" } });
    }
  },
  component: Login,
});

type LoginError = "invalid_email" | "invalid_code" | "offline" | null;

function Login() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const step = search.step ?? "email";
  const emailInUrl = search.email ?? "";

  const [email, setEmail] = useState(emailInUrl);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<LoginError>(null);

  const emailError = m["login.invalidEmail"]();
  const codeError =
    error === "invalid_code"
      ? m["login.invalidCode"]()
      : error === "offline"
        ? m["errors.offline"]()
        : "";

  async function requestCode(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const parsed = v.safeParse(emailSchema, email);
    if (!parsed.success) {
      setError("invalid_email");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/auth/request-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: parsed.output }),
      });
      if (!res.ok) throw new Error(String(res.status));
      await navigate({
        to: "/login",
        search: { step: "code", email: parsed.output },
        replace: true,
      });
    } catch {
      setError("offline");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const parsedEmail = v.safeParse(emailSchema, emailInUrl || email);
    const parsedCode = v.safeParse(codeSchema, code);
    if (!parsedEmail.success) {
      await navigate({
        to: "/login",
        search: { step: "email", email: "" },
        replace: true,
      });
      return;
    }
    if (!parsedCode.success) {
      setError("invalid_code");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/auth/verify-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: parsedEmail.output, code: parsedCode.output }),
      });
      if (res.status === 401) {
        setError("invalid_code");
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      await navigate({ to: "/app", replace: true });
    } catch {
      setError("offline");
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    const parsed = v.safeParse(emailSchema, emailInUrl || email);
    if (!parsed.success || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/auth/request-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: parsed.output }),
      });
      if (!res.ok) throw new Error(String(res.status));
    } catch {
      setError("offline");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grain flex min-h-[100dvh] items-center justify-center bg-surface px-5 py-16 text-content">
      <div className="w-full max-w-sm">
        <a href="/" className="flex items-center gap-2.5">
          <img src="/mark.png" alt="" className="h-5 w-5 rounded-[5px]" />
          <span className="font-display text-[19px] tracking-tight text-content">
            {m["app.title"]()}
          </span>
        </a>

        {step === "email" ? (
          <form onSubmit={requestCode} className="mt-10">
            <h1 className="font-display text-4xl leading-tight text-content">
              {m["login.title"]()}
            </h1>
            <p className="mt-3 text-[14px] leading-relaxed text-content-muted">
              {m["login.sub"]()}
            </p>

            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={m["login.emailPlaceholder"]()}
              aria-invalid={error === "invalid_email"}
              className="mt-6 w-full rounded-2xl border border-border-subtle bg-surface-raised px-4 py-3 text-[15px] text-content outline-none placeholder:text-content-faint focus:border-content-faint"
            />
            {error === "invalid_email" ? (
              <p className="mt-2 text-[13px] text-danger">{emailError}</p>
            ) : null}
            {error === "offline" ? (
              <p className="mt-2 text-[13px] text-danger">{m["errors.offline"]()}</p>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              className="mt-4 w-full rounded-full bg-content px-5 py-3 text-[14px] font-medium text-surface transition-transform duration-300 ease-[cubic-bezier(0.34,1.4,0.4,1)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
            >
              {busy ? m["login.sending"]() : m["login.sendCode"]()}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyCode} className="mt-10">
            <h1 className="font-display text-4xl leading-tight text-content">
              {m["login.codeTitle"]()}
            </h1>
            <p className="mt-3 text-[14px] leading-relaxed text-content-muted">
              {m["login.codeSub"]({ email: emailInUrl })}
            </p>

            <input
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              required
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder={m["login.codePlaceholder"]()}
              aria-invalid={error === "invalid_code"}
              className="mt-6 w-full rounded-2xl border border-border-subtle bg-surface-raised px-4 py-3 text-center font-display text-2xl tracking-[0.35em] text-content outline-none placeholder:text-content-faint focus:border-content-faint"
            />
            {codeError ? <p className="mt-2 text-[13px] text-danger">{codeError}</p> : null}

            <button
              type="submit"
              disabled={busy}
              className="mt-4 w-full rounded-full bg-content px-5 py-3 text-[14px] font-medium text-surface transition-transform duration-300 ease-[cubic-bezier(0.34,1.4,0.4,1)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
            >
              {busy ? m["login.verifying"]() : m["login.verify"]()}
            </button>

            <div className="mt-4 flex items-center justify-between text-[13px]">
              <button
                type="button"
                onClick={resend}
                disabled={busy}
                className="text-content-muted underline-offset-4 transition-colors hover:text-content hover:underline disabled:opacity-60"
              >
                {m["login.resend"]()}
              </button>
              <button
                type="button"
                onClick={() =>
                  navigate({ to: "/login", search: { step: "email", email: "" }, replace: true })
                }
                className="text-content-muted underline-offset-4 transition-colors hover:text-content hover:underline"
              >
                {m["login.changeEmail"]()}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
