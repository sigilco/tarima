import { createFileRoute, redirect, useNavigate, useRouter } from "@tanstack/react-router";

import { ProjectList } from "#/components/workspace/ProjectList";
import { WorkspaceShell } from "#/components/workspace/WorkspaceShell";
import { createServerFn } from "@tanstack/react-start";

import { createProject } from "../../lib/api";
import { fetchProjectsFn } from "../../lib/api-server";

/**
 * /app (screens workspace-1 + workspace-2): the NEW workspace shell —
 * sidebar plus the projects list. Replaces the old brief-first project
 * index (SP5-A); the old board/room stay reachable at /app/p/$projectId
 * until SP7 tears the old platform UI down.
 *
 * The loader fetches the projects server-side (SSR) with the session
 * cookie forwarded; a 401 redirects to /login. Create posts through the
 * api from the browser and navigates to the new project view.
 */

const fetchWorkspaceProjectsFn = createServerFn({ method: "GET", strict: false }).handler(
  async (): Promise<{ status: number; body: { projects: unknown[] } | null }> => fetchProjectsFn(),
);

export const Route = createFileRoute("/app/")({
  loader: async () => {
    const served = await fetchWorkspaceProjectsFn();
    if (served.status === 401) {
      throw redirect({ to: "/login", search: { step: "email", email: "" } });
    }
    return served;
  },
  component: WorkspaceHome,
});

function WorkspaceHome() {
  const served = Route.useLoaderData();
  const navigate = useNavigate();
  const router = useRouter();

  const state = served.status === 200 ? "ready" : "error";
  const projects = (served.body?.projects ?? []) as {
    id: string;
    name: string;
    stage?: string;
    createdAt: string;
  }[];

  return (
    <WorkspaceShell>
      <ProjectList
        state={state}
        projects={projects}
        onRetry={() => void router.invalidate()}
        onOpen={(projectId) => void navigate({ to: "/app/w/$projectId", params: { projectId } })}
        onCreate={async (name) => {
          const { project } = await createProject(name);
          await navigate({ to: "/app/w/$projectId", params: { projectId: project.id } });
        }}
      />
    </WorkspaceShell>
  );
}
