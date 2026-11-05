import { createFileRoute, redirect, useNavigate, useRouter } from "@tanstack/react-router";

import { ProjectList } from "#/components/workspace/ProjectList";
import { WorkspaceShell } from "#/components/workspace/WorkspaceShell";
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
 *
 * One server function, called directly: an earlier version wrapped
 * `fetchProjectsFn` in a second `createServerFn` and called the inner one.
 * Only the outer id was registered in the server-fn manifest, so the inner
 * id 500'd the route with "Server function info not found" once the inner
 * module was small enough to be inlined into this chunk (SP7).
 */

export const Route = createFileRoute("/app/")({
  loader: async () => {
    const served = await fetchProjectsFn();
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
