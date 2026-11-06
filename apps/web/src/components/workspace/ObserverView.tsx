import * as m from "#/paraglide/messages.js";

import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";

/** One board row of the read-only observer view (contract entitySchema). */
export interface ObserverEntity {
  id: string;
  name: string;
  contact?: string;
  status: string;
  missing: string[];
  updatedAt: string;
}

export interface ObserverViewProps {
  state: "loading" | "error" | "unauthorized" | "ready";
  project?: { id: string; name: string; stage?: string };
  entities?: ObserverEntity[];
  sharedByName?: string | null;
  expiresAt?: number | null;
  onRetry?: () => void;
}

const tableHead =
  "border-b border-border px-4 py-2.5 text-left text-[12px] font-medium uppercase tracking-wide text-muted-foreground";
const tableCell = "px-4 py-2.5 text-muted-foreground";

/**
 * The public read-only project view an observer link opens
 * (/app/o/:projectId?share_token=…). No session, no chrome: a banner
 * saying who shared it, the project header and the same entities table
 * the owner sees. Mutations do not exist on this surface.
 */
export function ObserverView({
  state,
  project,
  entities,
  sharedByName,
  expiresAt,
  onRetry,
}: ObserverViewProps) {
  if (state === "unauthorized") {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {m["observer.expiredTitle"]()}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{m["observer.expiredBody"]()}</p>
      </main>
    );
  }

  if (state === "error") {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {m["observer.notFoundTitle"]()}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{m["observer.notFoundBody"]()}</p>
        {onRetry ? (
          <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
            {m["workspace.retry"]()}
          </Button>
        ) : null}
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between gap-3">
        <a href="/" className="text-[17px] font-semibold tracking-tight text-foreground">
          {m["app.title"]()}
        </a>
        <span className="rounded-md bg-muted px-2 py-0.5 text-[12px] text-muted-foreground">
          {m["observer.readOnly"]()}
        </span>
      </div>

      <p className="mt-6 text-[13px] text-muted-foreground">
        {sharedByName ? m["observer.sharedBy"]({ name: sharedByName }) : m["observer.banner"]()}
        {expiresAt
          ? ` · ${m["observer.expires"]({
              date: new Date(expiresAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              }),
            })}`
          : ""}
      </p>

      {state === "loading" ? (
        <div className="mt-6 space-y-3" aria-busy="true">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <>
          <h1 className="mt-3 truncate text-2xl font-semibold tracking-tight text-foreground">
            {project?.name}
          </h1>
          <p className="mt-1 flex items-center gap-2 text-[13px] text-muted-foreground">
            {m["stage.label"]()}:
            <span className="rounded-md bg-muted px-2 py-0.5 text-[12px] text-muted-foreground">
              {project?.stage ?? m["workspace.noStage"]()}
            </span>
          </p>

          <div className="mt-5 overflow-hidden rounded-lg border border-border bg-card">
            {(entities ?? []).length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                {m["workspace.projectEmpty"]()}
              </p>
            ) : (
              <table className="w-full text-left text-[13.5px]">
                <thead>
                  <tr>
                    <th className={tableHead}>{m["board.colName"]()}</th>
                    <th className={tableHead}>{m["board.colContact"]()}</th>
                    <th className={tableHead}>{m["board.colStatus"]()}</th>
                    <th className={tableHead}>{m["board.colMissing"]()}</th>
                    <th className={tableHead}>{m["board.colUpdated"]()}</th>
                  </tr>
                </thead>
                <tbody>
                  {(entities ?? []).map((entity) => (
                    <tr key={entity.id} className="border-b border-border last:border-b-0">
                      <td className="px-4 py-2.5 font-medium text-foreground">{entity.name}</td>
                      <td className={tableCell}>{entity.contact ?? m["board.noContact"]()}</td>
                      <td className={tableCell}>{entity.status}</td>
                      <td className={tableCell}>
                        {entity.missing.length === 0
                          ? m["row.noMissing"]()
                          : entity.missing.join("; ")}
                      </td>
                      <td className={tableCell}>
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
        </>
      )}
    </main>
  );
}
