import type { FormEvent } from "react";

import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import * as m from "#/paraglide/messages.js";

export type EmailStepError = "invalid_email" | "rate_limited" | "offline" | null;

/**
 * EmailStep: the idle/sending/error states of the email entry step
 * (screen auth-1). Purely presentational — the route owns the fetch.
 */
export function EmailStep({
  email,
  busy,
  error,
  onEmailChange,
  onSubmit,
}: {
  email: string;
  busy: boolean;
  error: EmailStepError;
  onEmailChange: (email: string) => void;
  onSubmit: (e: FormEvent) => void;
}) {
  const errorText =
    error === "invalid_email"
      ? m["login.invalidEmail"]()
      : error === "rate_limited"
        ? m["login.rateLimited"]()
        : error === "offline"
          ? m["errors.offline"]()
          : "";

  return (
    <form onSubmit={onSubmit} className="mt-10">
      <h1 className="text-4xl font-semibold leading-tight tracking-tight text-foreground">
        {m["login.title"]()}
      </h1>
      <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">{m["login.sub"]()}</p>

      <Input
        type="email"
        required
        autoFocus
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        placeholder={m["login.emailPlaceholder"]()}
        aria-invalid={error === "invalid_email"}
        className="mt-6 h-11 bg-card px-4 text-[15px]"
      />
      {errorText ? <p className="mt-2 text-[13px] text-destructive">{errorText}</p> : null}

      <Button type="submit" disabled={busy} className="mt-4 h-11 w-full text-[14px]">
        {busy ? m["login.sending"]() : m["login.sendCode"]()}
      </Button>
    </form>
  );
}
