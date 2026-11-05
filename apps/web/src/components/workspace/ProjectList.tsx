import { cva } from "class-variance-authority";
import { useState, type FormEvent } from "react";

import * as m from "#/paraglide/messages.js";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Skeleton } from "../ui/skeleton";

/** The wire shape of a project row (lib/api.ts ProjectWire, stage optional). */
export interface WorkspaceProject {
  id: string;
  name: string;
  stage?: string;
  createdAt: string;
}

const rowVariants = cva(
  "flex w-full items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
);

export interface ProjectListProps {
  state: "loading" | "error" | "ready";
  projects?: WorkspaceProject[];
  onRetry?: () => void;
  onOpen?: (projectId: string) => void;
  onCreate?: (name: string) => Promise<void>;
}

/**
 * The projects list inside the workspace shell (screens workspace-2).
 *
 * Pure presentation: the route loader feeds `state` + `projects`; create
 * posts through the `onCreate` callback (POST /api/ui/projects { name })
 * and navigates on success. The old brief-first form at /app stays until
 * SP7; this screen uses the minimal name-only creation path.
 */
export function ProjectList({ state, projects, onRetry, onOpen, onCreate }: ProjectListProps) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy || !onCreate) return;
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 200) {
      setError(m["login.invalidEmail"]());
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onCreate(trimmed);
    } catch {
      setError(m["errors.offline"]());
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {m["app.projects"]()}
        </h1>
        {!creating && onCreate ? (
          <Button size="sm" onClick={() => setCreating(true)}>
            {m["app.newProject"]()}
          </Button>
        ) : null}
      </div>

      {creating && onCreate ? (
        <form onSubmit={submit} className="mt-4 flex gap-2">
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={m["app.newProjectName"]()}
            aria-label={m["app.newProjectName"]()}
            aria-invalid={Boolean(error)}
          />
          <Button type="submit" size="sm" disabled={busy}>
            {busy ? m["workspace.creating"]() : m["app.newProjectSubmit"]()}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setCreating(false);
              setError(null);
            }}
          >
            ✕
          </Button>
        </form>
      ) : null}
      {error ? <p className="mt-2 text-[13px] text-destructive">{error}</p> : null}

      <div className="mt-6">
        {state === "loading" ? (
          <div className="space-y-2" aria-busy="true">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : state === "error" ? (
          <div className="rounded-lg border border-border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">{m["errors.offline"]()}</p>
            {onRetry ? (
              <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
                {m["workspace.retry"]()}
              </Button>
            ) : null}
          </div>
        ) : (projects ?? []).length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            {m["app.empty"]()}
          </p>
        ) : (
          <ul className="space-y-2">
            {(projects ?? []).map((project) => (
              <li key={project.id}>
                <button
                  type="button"
                  className={rowVariants()}
                  onClick={() => onOpen?.(project.id)}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[14.5px] font-medium text-foreground">
                      {project.name}
                    </span>
                    <span className="mt-0.5 block text-[12.5px] text-muted-foreground">
                      {new Date(project.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[12px] text-muted-foreground">
                      {project.stage ?? m["workspace.noStage"]()}
                    </span>
                    <span className="text-[13px] text-muted-foreground">
                      {m["workspace.open"]()} →
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
