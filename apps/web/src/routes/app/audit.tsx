import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";

import { AuditView } from "#/components/workspace/AuditView";
import { WorkspaceShell } from "#/components/workspace/WorkspaceShell";
import { fetchAuditFn } from "../../lib/api-server";

/**
 * /app/audit: the read-only audit tab — the caller's mirrored approval
 * decisions (`approvals`) and agent session facts (`agent_events`),
 * served by GET /api/ui/audit scoped to the session principal. The
 * loader 401s to /login like every other /app route.
 */
export const Route = createFileRoute("/app/audit")({
  loader: async () => {
    const served = await fetchAuditFn();
    if (served.status === 401) {
      throw redirect({ to: "/login", search: { step: "email", email: "" } });
    }
    return served;
  },
  component: AuditPage,
});

function AuditPage() {
  const served = Route.useLoaderData();
  const router = useRouter();

  const state = served.status === 200 ? "ready" : "error";

  return (
    <WorkspaceShell active="audit">
      <AuditView
        state={state}
        approvals={served.body?.approvals ?? []}
        events={served.body?.events ?? []}
        onRetry={() => void router.invalidate()}
      />
    </WorkspaceShell>
  );
}
