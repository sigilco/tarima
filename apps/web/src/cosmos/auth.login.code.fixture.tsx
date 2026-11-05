import { useState } from "react";

import { AuthShell } from "#/components/auth/AuthShell";
import { CodeStep, type CodeStepError } from "#/components/auth/CodeStep";

function Harness({ error, busy, code }: { error: CodeStepError; busy: boolean; code: string }) {
  const [value, setValue] = useState(code);
  return (
    <AuthShell>
      <CodeStep
        email="qa@tarima.test"
        code={value}
        busy={busy}
        error={error}
        onCodeChange={setValue}
        onSubmit={(e) => e.preventDefault()}
        onResend={() => {}}
        onChangeEmail={() => {}}
      />
    </AuthShell>
  );
}

export default {
  Idle: <Harness error={null} busy={false} code="" />,
  Filled: <Harness error={null} busy={false} code="123456" />,
  Verifying: <Harness error={null} busy={true} code="123456" />,
  InvalidCode: <Harness error="invalid_code" busy={false} code="999999" />,
  NotAllowlisted: <Harness error="not_allowlisted" busy={false} code="123456" />,
  RateLimited: <Harness error="rate_limited" busy={false} code="123456" />,
  Offline: <Harness error="offline" busy={false} code="123456" />,
};
