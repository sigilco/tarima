import { useEffect, useState, type FormEvent } from "react";

import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import * as m from "#/paraglide/messages.js";

export type CodeStepError = "invalid_code" | "not_allowlisted" | "rate_limited" | "offline" | null;

const CODE_TTL_SECONDS = 10 * 60;

function formatRemaining(seconds: number) {
  const mm = Math.floor(seconds / 60);
  const ss = String(seconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

/**
 * CodeStep: the idle/verifying/error/expired states of the code entry step
 * (screen auth-2). The countdown is a client-side hint only — expiry is
 * enforced server-side. Purely presentational; the route owns the fetches.
 */
export function CodeStep({
  email,
  code,
  busy,
  error,
  onCodeChange,
  onSubmit,
  onResend,
  onChangeEmail,
}: {
  email: string;
  code: string;
  busy: boolean;
  error: CodeStepError;
  onCodeChange: (code: string) => void;
  onSubmit: (e: FormEvent) => void;
  onResend: () => void;
  onChangeEmail: () => void;
}) {
  const [remaining, setRemaining] = useState(CODE_TTL_SECONDS);

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [remaining > 0]);

  const expired = remaining === 0;
  const errorText =
    error === "invalid_code"
      ? m["login.invalidCode"]()
      : error === "not_allowlisted"
        ? m["login.notAllowlisted"]()
        : error === "rate_limited"
          ? m["login.rateLimited"]()
          : error === "offline"
            ? m["errors.offline"]()
            : "";

  return (
    <form onSubmit={onSubmit} className="mt-10">
      <h1 className="text-4xl font-semibold leading-tight tracking-tight text-foreground">
        {m["login.codeTitle"]()}
      </h1>
      <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
        {m["login.codeSub"]({ email })}
      </p>

      <Input
        type="text"
        inputMode="numeric"
        pattern="\d{6}"
        maxLength={6}
        required
        autoFocus
        value={code}
        onChange={(e) => onCodeChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
        placeholder={m["login.codePlaceholder"]()}
        aria-invalid={error === "invalid_code"}
        className="mt-6 h-12 bg-card text-center text-2xl font-semibold tracking-[0.35em]"
      />
      {errorText ? <p className="mt-2 text-[13px] text-destructive">{errorText}</p> : null}
      {expired ? (
        <p className="mt-2 text-[13px] text-destructive">{m["login.expired"]()}</p>
      ) : (
        <p className="mt-2 text-[13px] text-muted-foreground">
          {m["login.expiresIn"]({ time: formatRemaining(remaining) })}
        </p>
      )}

      <Button type="submit" disabled={busy} className="mt-4 h-11 w-full text-[14px]">
        {busy ? m["login.verifying"]() : m["login.verify"]()}
      </Button>

      <div className="mt-4 flex items-center justify-between text-[13px]">
        <Button
          type="button"
          variant="link"
          disabled={busy}
          onClick={() => {
            setRemaining(CODE_TTL_SECONDS);
            onResend();
          }}
          className="h-auto p-0 text-[13px] text-muted-foreground"
        >
          {m["login.resend"]()}
        </Button>
        <Button
          type="button"
          variant="link"
          onClick={onChangeEmail}
          className="h-auto p-0 text-[13px] text-muted-foreground"
        >
          {m["login.changeEmail"]()}
        </Button>
      </div>
    </form>
  );
}
