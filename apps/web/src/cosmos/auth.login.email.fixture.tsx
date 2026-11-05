import { useState } from "react";

import { AuthShell } from "#/components/auth/AuthShell";
import { EmailStep, type EmailStepError } from "#/components/auth/EmailStep";

function Harness({ error, busy }: { error: EmailStepError; busy: boolean }) {
  const [email, setEmail] = useState(error ? "not-an-email" : "");
  return (
    <AuthShell>
      <EmailStep
        email={email}
        busy={busy}
        error={error}
        onEmailChange={setEmail}
        onSubmit={(e) => e.preventDefault()}
      />
    </AuthShell>
  );
}

export default {
  Idle: <Harness error={null} busy={false} />,
  InvalidEmail: <Harness error="invalid_email" busy={false} />,
  RateLimited: <Harness error="rate_limited" busy={false} />,
  Offline: <Harness error="offline" busy={false} />,
  Sending: <Harness error={null} busy={true} />,
};
