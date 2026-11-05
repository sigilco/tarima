import * as m from "#/paraglide/messages.js";

import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { ChatPanelSlot } from "./ChatPanelSlot";

/** One entity row of the read-only table (contract entitySchema). */
export interface WorkspaceEntity {
  id: string;
  name: string;
  contact?: string;
  status: string;
  missing: string[];
  updatedAt: string;
}

export interface ProjectViewProps {
  state: "loading" | "error" | "ready";
  project?: { id: string; name: string; stage?: string };
  entities?: WorkspaceEntity[];
  onRetry?: () => void;
  onBack?: () => void;
}

/**
 * One project inside the workspace shell (screens workspace-3).
 *
 * Header (name + stage badge), the read-only entities table from
 * GET /api/ui/projects/:projectId/entities, and the <ChatPanelSlot/>
 * reserved for the eve chat panel (SP4). Editing rows stays on the old
 * board at /app/p/$projectId until SP7 — the header links there.
 */
export function ProjectView({ state, project, entities, onRetry, onBack }: ProjectViewProps) {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <button
        type="button"
        onClick={onBack}
        className="text-[13px] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        ← {m["app.backToProjects"]()}
      </button>

      {state === "loading" ? (
        <div className="mt-4 space-y-3" aria-busy="true">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="mt-6 h-32 w-full" />
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
      ) : (
        <>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground">
                {project?.name}
              </h1>
              <p className="mt-1 flex items-center gap-2 text-[13px] text-muted-foreground">
                {m["stage.label"]()}:
                <span className="rounded-md bg-muted px-2 py-0.5 text-[12px] text-muted-foreground">
                  {project?.stage ?? m["workspace.noStage"]()}
                </span>
              </p>
            </div>
            <a
              href={`/app/p/${project?.id}`}
              className="text-[13px] font-medium text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {m["workspace.oldBoard"]()} →
            </a>
          </div>

          <div className="mt-5 overflow-hidden rounded-lg border border-border bg-card">
            {(entities ?? []).length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                {m["workspace.projectEmpty"]()}
              </p>
            ) : (
              <table className="w-full text-left text-[13.5px]">
                <thead>
                  <tr className="border-b border-border text-[12px] uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-2.5 font-medium">{m["board.colName"]()}</th>
                    <th className="px-4 py-2.5 font-medium">{m["board.colContact"]()}</th>
                    <th className="px-4 py-2.5 font-medium">{m["board.colStatus"]()}</th>
                    <th className="px-4 py-2.5 font-medium">{m["board.colMissing"]()}</th>
                    <th className="px-4 py-2.5 font-medium">{m["board.colUpdated"]()}</th>
                  </tr>
                </thead>
                <tbody>
                  {(entities ?? []).map((entity) => (
                    <tr key={entity.id} className="border-b border-border last:border-b-0">
                      <td className="px-4 py-2.5 font-medium text-foreground">{entity.name}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {entity.contact ?? m["board.noContact"]()}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">{entity.status}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {entity.missing.length === 0
                          ? m["row.noMissing"]()
                          : entity.missing.join("; ")}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {new Date(entity.updatedAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <ChatPanelSlot />
        </>
      )}
    </div>
  );
}
