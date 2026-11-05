import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import * as v from "valibot";

import { AuthShell } from "#/components/auth/AuthShell";
import { CodeStep, type CodeStepError } from "#/components/auth/CodeStep";
import { EmailStep, type EmailStepError } from "#/components/auth/EmailStep";

/**
 * /login (Stage 5, T5.2): the two-step email -> code flow of login.md,
 * re-themed on shadcn (screens auth-1/auth-2).
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

type LoginError = EmailStepError | CodeStepError;

function Login() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const step = search.step ?? "email";
  const emailInUrl = search.email ?? "";

  const [email, setEmail] = useState(emailInUrl);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<LoginError>(null);

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
      if (res.status === 429) {
        setError("rate_limited");
        return;
      }
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
      if (res.status === 403) {
        // The beta gate: the code was right, the address is not on the list.
        setError("not_allowlisted");
        return;
      }
      if (res.status === 429) {
        setError("rate_limited");
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
      if (res.status === 429) {
        setError("rate_limited");
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
    } catch {
      setError("offline");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell>
      {step === "email" ? (
        <EmailStep
          email={email}
          busy={busy}
          error={error as EmailStepError}
          onEmailChange={setEmail}
          onSubmit={requestCode}
        />
      ) : (
        <CodeStep
          email={emailInUrl}
          code={code}
          busy={busy}
          error={error as CodeStepError}
          onCodeChange={setCode}
          onSubmit={verifyCode}
          onResend={resend}
          onChangeEmail={() =>
            navigate({ to: "/login", search: { step: "email", email: "" }, replace: true })
          }
        />
      )}
    </AuthShell>
  );
}
