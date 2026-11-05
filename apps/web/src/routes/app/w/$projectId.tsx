import { createFileRoute, redirect, useNavigate, useRouter } from "@tanstack/react-router";

import { ProjectView } from "#/components/workspace/ProjectView";
import { WorkspaceShell } from "#/components/workspace/WorkspaceShell";
import { createServerFn } from "@tanstack/react-start";

/**
 * /app/w/$projectId (screen workspace-3): one project inside the NEW
 * workspace shell — header, read-only entities table and the chat slot.
 *
 * The NEW view lives under /app/w/… because the OLD board already owns
 * /app/p/$projectId and must stay reachable there until SP7 removes the
 * old platform UI. Both fetches go through server functions so the
 * session cookie authenticates SSR exactly like client navigation.
 */

type ProjectShape = { id: string; name: string; stage?: string };
type EntityShape = {
  id: string;
  name: string;
  contact?: string;
  status: string;
  missing: string[];
  updatedAt: string;
};

const fetchRaw = (path: string): Promise<Response> => {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return fetch(`${origin}${path}`, { headers: { "x-tarima-internal": "1" } });
};

const fetchProjectFn = createServerFn({ method: "GET", strict: false })
  .validator((raw: unknown) => (typeof raw === "string" && raw.length > 0 ? raw : null))
  .handler(async ({ data }): Promise<{ status: number; body: unknown }> => {
    const res = await fetchRaw(`/api/ui/projects/${encodeURIComponent(String(data))}`);
    return { status: res.status, body: await res.json().catch(() => null) };
  });

const fetchEntitiesFn = createServerFn({ method: "GET", strict: false })
  .validator((raw: unknown) => (typeof raw === "string" && raw.length > 0 ? raw : null))
  .handler(async ({ data }): Promise<{ status: number; body: unknown }> => {
    const res = await fetchRaw(`/api/ui/projects/${encodeURIComponent(String(data))}/entities`);
    return { status: res.status, body: await res.json().catch(() => null) };
  });

export const Route = createFileRoute("/app/w/$projectId")({
  loader: async ({ params }) => {
    const [project, entities] = await Promise.all([
      fetchProjectFn({ data: params.projectId }),
      fetchEntitiesFn({ data: params.projectId }),
    ]);
    if (project.status === 401 || entities.status === 401) {
      throw redirect({ to: "/login", search: { step: "email", email: "" } });
    }
    return { project, entities };
  },
  component: WorkspaceProject,
});

function WorkspaceProject() {
  const data = Route.useLoaderData() as {
    project: { status: number; body: { project: ProjectShape } | null };
    entities: { status: number; body: { entities: EntityShape[] } | null };
  };
  const navigate = useNavigate();
  const router = useRouter();

  if (data.project.status === 404 || data.entities.status === 404) {
    return (
      <WorkspaceShell>
        <ProjectView
          state="error"
          onRetry={() => void router.invalidate()}
          onBack={() => void navigate({ to: "/app" })}
        />
      </WorkspaceShell>
    );
  }

  if (data.project.status !== 200 || data.entities.status !== 200) {
    return (
      <WorkspaceShell>
        <ProjectView
          state="error"
          onRetry={() => void router.invalidate()}
          onBack={() => void navigate({ to: "/app" })}
        />
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell>
      <ProjectView
        state="ready"
        project={data.project.body?.project}
        entities={data.entities.body?.entities ?? []}
        onRetry={() => void router.invalidate()}
        onBack={() => void navigate({ to: "/app" })}
      />
    </WorkspaceShell>
  );
}
