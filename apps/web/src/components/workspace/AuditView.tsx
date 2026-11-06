import * as m from "#/paraglide/messages.js";

import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";

/** One approval decision row (GET /api/ui/audit). */
export interface AuditApproval {
  id: string;
  toolName: string;
  status: string;
  projectId: string | null;
  decidedBy: string | null;
  decidedAt: number | null;
  createdAt: number;
}

/** One mirrored agent fact row (GET /api/ui/audit). */
export interface AuditEvent {
  sessionId: string;
  type: string;
  createdAt: number;
}

export interface AuditViewProps {
  state: "loading" | "error" | "ready";
  approvals?: AuditApproval[];
  events?: AuditEvent[];
  onRetry?: () => void;
}

function formatTime(ms: number): string {
  return new Date(ms).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const tableHead =
  "border-b border-border px-4 py-2.5 text-left text-[12px] font-medium uppercase tracking-wide text-muted-foreground";
const tableCell = "px-4 py-2.5 text-muted-foreground";

/**
 * The Audit tab (read-only): the caller's mirrored approval decisions
 * and agent session facts from `agent_events` + `approvals`, newest
 * first. Everything here already happened — the tab only records it.
 */
export function AuditView({ state, approvals, events, onRetry }: AuditViewProps) {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        {m["audit.title"]()}
      </h1>

      {state === "loading" ? (
        <div className="mt-6 space-y-3" aria-busy="true">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : state === "error" ? (
        <div className="mt-10 rounded-lg border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">{m["errors.offline"]()}</p>
          {onRetry ? (
            <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
              {m["workspace.retry"]()}
            </Button>
          ) : null}
        </div>
      ) : (approvals ?? []).length === 0 && (events ?? []).length === 0 ? (
        <p className="mt-10 rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          {m["audit.empty"]()}
        </p>
      ) : (
        <div className="mt-6 space-y-8">
          <section>
            <h2 className="text-[13px] font-medium uppercase tracking-wide text-muted-foreground">
              {m["audit.approvals"]()}
            </h2>
            <div className="mt-3 overflow-hidden rounded-lg border border-border bg-card">
              {(approvals ?? []).length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">
                  {m["audit.empty"]()}
                </p>
              ) : (
                <table className="w-full text-left text-[13.5px]">
                  <thead>
                    <tr>
                      <th className={tableHead}>{m["audit.colTime"]()}</th>
                      <th className={tableHead}>{m["audit.colTool"]()}</th>
                      <th className={tableHead}>{m["audit.colStatus"]()}</th>
                      <th className={tableHead}>{m["audit.colDecidedBy"]()}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(approvals ?? []).map((approval) => (
                      <tr key={approval.id} className="border-b border-border last:border-b-0">
                        <td className={`${tableCell} whitespace-nowrap`}>
                          {formatTime(approval.decidedAt ?? approval.createdAt)}
                        </td>
                        <td className={`${tableCell} font-medium text-foreground`}>
                          {approval.toolName}
                        </td>
                        <td className={tableCell}>{approval.status}</td>
                        <td className={`${tableCell} truncate`}>
                          {approval.decidedBy ?? m["workspace.noStage"]()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-[13px] font-medium uppercase tracking-wide text-muted-foreground">
              {m["audit.activity"]()}
            </h2>
            <div className="mt-3 overflow-hidden rounded-lg border border-border bg-card">
              {(events ?? []).length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">
                  {m["audit.empty"]()}
                </p>
              ) : (
                <table className="w-full text-left text-[13.5px]">
                  <thead>
                    <tr>
                      <th className={tableHead}>{m["audit.colTime"]()}</th>
                      <th className={tableHead}>{m["audit.colEvent"]()}</th>
                      <th className={tableHead}>{m["audit.colSession"]()}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(events ?? []).map((event, index) => (
                      <tr
                        key={`${event.sessionId}-${event.createdAt}-${index}`}
                        className="border-b border-border last:border-b-0"
                      >
                        <td className={`${tableCell} whitespace-nowrap`}>
                          {formatTime(event.createdAt)}
                        </td>
                        <td className={`${tableCell} font-medium text-foreground`}>{event.type}</td>
                        <td className={`${tableCell} truncate font-mono text-[12px]`}>
                          {event.sessionId}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
