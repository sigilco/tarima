import { createFileRoute } from "@tanstack/react-router";
import { fetchRoomFn } from "../../lib/api-server";
import { NegotiationRoomView } from "../../components/NegotiationRoomView";

export const Route = createFileRoute("/projects/$projectId_/room")({
  validateSearch: (search: Record<string, unknown>) => ({
    share_token: typeof search.share_token === "string" ? search.share_token : undefined,
  }),
  loaderDeps: ({ search }) => ({
    shareToken: search.share_token,
  }),
  loader: async ({ params, deps }) => {
    const served = await fetchRoomFn({
      data: { projectId: params.projectId, shareToken: deps.shareToken },
    });
    if (served.status === 401) {
      return { status: 401 as const, payload: null };
    }
    if (served.status === 404 || !served.body) {
      return { status: 404 as const, payload: null };
    }
    return { status: 200 as const, payload: served.body };
  },
  component: ProjectsNegotiationRoom,
});

function ProjectsNegotiationRoom() {
  const { projectId } = Route.useParams();
  const search = Route.useSearch();
  const data = Route.useLoaderData();

  if (data.status === 401) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center p-6 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-surface-raised text-content-faint">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h1 className="mt-4 font-display text-2xl text-content">Access Expired or Invalid</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-content-muted">
          This negotiation room link has expired or been revoked. Please ask the event organizer for
          a new invitation link.
        </p>
      </main>
    );
  }

  if (data.status === 404 || !data.payload) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center p-6 text-center">
        <h1 className="font-display text-2xl text-content">Room Not Found</h1>
        <p className="mt-2 text-[14px] text-content-muted">
          This negotiation room does not exist or has been removed.
        </p>
      </main>
    );
  }

  return (
    <NegotiationRoomView
      projectId={projectId}
      projectName={data.payload.project.name}
      shareToken={search.share_token}
      initialRole={data.payload.access.role}
    />
  );
}
