import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShareRecipientBanner } from "../../../components/ShareRecipientBanner";
import { eventsUrl, type RoomPayload } from "../../../lib/api";
import { fetchRoomFn } from "../../../lib/api-server";

export const Route = createFileRoute("/app/p/$projectId_/room")({
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
  component: NegotiationRoom,
});

function NegotiationRoom() {
  const { projectId } = Route.useParams();
  const search = Route.useSearch();
  const router = useRouter();
  const data = Route.useLoaderData();
  const [live, setLive] = useState<"connecting" | "live" | "down">("connecting");

  // SSE connection: both session owner and token observer receive live updates
  useEffect(() => {
    if (typeof window === "undefined" || data.status !== 200) return;
    const source = new EventSource(eventsUrl(projectId, search.share_token));

    const onBoard = () => {
      void router.invalidate();
    };
    source.addEventListener("board", onBoard);
    source.addEventListener("open", () => setLive("live"));
    source.addEventListener("error", () => setLive("down"));

    return () => {
      source.removeEventListener("board", onBoard);
      source.close();
    };
  }, [projectId, router, search.share_token, data.status]);

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

  const payload: RoomPayload = data.payload;
  const isObserver = payload.access.role === "observer";
  const brief = (payload.project.goal?.brief as Record<string, unknown> | undefined) ?? {};

  return (
    <div className="min-h-screen bg-surface">
      {isObserver ? <ShareRecipientBanner sharedByName={payload.access.sharedByName} /> : null}

      <div className="mx-auto max-w-5xl px-4 py-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle pb-6">
          <div>
            <div className="flex items-center gap-2 text-[13px] text-content-muted">
              {!isObserver ? (
                <>
                  <Link
                    to="/app/p/$projectId"
                    params={{ projectId }}
                    search={{ filter: undefined, row: undefined, csv: undefined, add: undefined }}
                    className="hover:text-content"
                  >
                    Board
                  </Link>
                  <span>/</span>
                </>
              ) : null}
              <span>Negotiation Room</span>
            </div>
            <h1 className="mt-1 font-display text-3xl text-content">{payload.project.name}</h1>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-2 rounded-full border border-border-subtle px-3 py-1 text-[12px] ${
                live === "live"
                  ? "text-success"
                  : live === "down"
                    ? "text-danger"
                    : "text-content-faint"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  live === "live"
                    ? "bg-success"
                    : live === "down"
                      ? "bg-danger"
                      : "bg-content-faint"
                }`}
              />
              {live === "live" ? "Live observer" : live === "down" ? "Reconnecting" : "Connecting"}
            </span>

            {isObserver ? (
              <span className="rounded-full bg-surface-raised px-3 py-1 text-[12px] font-medium text-content-muted">
                Read-only observer
              </span>
            ) : (
              <span className="rounded-full bg-accent-soft px-3 py-1 text-[12px] font-medium text-accent">
                Organizer owner
              </span>
            )}
          </div>
        </header>

        <main className="mt-8 grid gap-6 md:grid-cols-3">
          {/* Brief overview */}
          <div className="rounded-2xl border border-border-subtle bg-surface-raised p-5 md:col-span-1">
            <h2 className="text-[14px] font-semibold text-content">Event Brief</h2>
            <dl className="mt-4 space-y-3 text-[13px]">
              <div>
                <dt className="text-content-faint">City</dt>
                <dd className="font-medium text-content">
                  {String(brief.city ?? "Not specified")}
                </dd>
              </div>
              <div>
                <dt className="text-content-faint">Target Capacity</dt>
                <dd className="font-medium text-content">
                  {brief.capacity ? `${String(brief.capacity)} attendees` : "Flexible"}
                </dd>
              </div>
              <div>
                <dt className="text-content-faint">Target Date</dt>
                <dd className="font-medium text-content">{String(brief.date ?? "TBD")}</dd>
              </div>
              <div>
                <dt className="text-content-faint">Budget Range</dt>
                <dd className="font-medium text-content">{String(brief.budget ?? "Standard")}</dd>
              </div>
            </dl>
          </div>

          {/* Negotiation terms panel */}
          <div className="rounded-2xl border border-border-subtle bg-surface-raised p-5 md:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-[14px] font-semibold text-content">Negotiation Terms</h2>
              <span className="rounded-full border border-border-subtle bg-surface px-2.5 py-0.5 text-[11px] font-medium text-content-muted capitalize">
                Stage: {payload.project.stage}
              </span>
            </div>

            <div className="mt-4 rounded-xl border border-border-subtle bg-surface p-4">
              <p className="text-[13px] leading-relaxed text-content-muted">
                {isObserver
                  ? "You are viewing the current negotiation terms and counter-offer draft in observer mode. Updates made by the negotiation agent and organizer will refresh live automatically."
                  : "You are viewing the negotiation terms as room owner."}
              </p>

              <div className="mt-4 border-t border-border-subtle pt-4">
                <h3 className="text-[12px] font-semibold tracking-wide text-content-faint uppercase">
                  Current Terms Summary
                </h3>
                <pre className="mt-2 overflow-x-auto rounded-lg bg-surface-sunken p-3 text-[12px] text-content-muted">
                  {JSON.stringify(payload.room.terms ?? {}, null, 2)}
                </pre>
              </div>
            </div>

            {isObserver ? (
              <p className="mt-4 text-[12px] text-content-faint text-center">
                Mutating controls are disabled in observer view.
              </p>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
