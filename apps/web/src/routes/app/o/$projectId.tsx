import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { ObserverView } from "#/components/workspace/ObserverView";

/**
 * /app/o/$projectId?share_token=… — the public read-only project view
 * an observer link opens. No session: the token is the credential, and
 * the api answers a uniform 401 for invalid, expired, revoked or
 * wrong-project tokens.
 *
 * The fetch goes to the api mounted in-process on the request's own
 * origin (same trick as /app/w/$projectId); outside a request we fall
 * back to the server's port.
 */

function requestOrigin(): string {
  if (typeof window !== "undefined") return window.location.origin;
  try {
    return new URL(getRequest().url).origin;
  } catch {
    return process.env.VITE_API_ORIGIN ?? `http://localhost:${process.env.PORT ?? 3000}`;
  }
}

type Served = { status: number; body: unknown };

const fetchObserverFn = createServerFn({ method: "GET", strict: false })
  .validator((raw: unknown): { projectId: string; shareToken?: string } | null => {
    if (typeof raw !== "object" || raw === null) return null;
    const { projectId, shareToken } = raw as Record<string, unknown>;
    if (typeof projectId !== "string" || projectId.length === 0) return null;
    return {
      projectId,
      ...(typeof shareToken === "string" && shareToken.length > 0 ? { shareToken } : {}),
    };
  })
  .handler(async ({ data }): Promise<Served> => {
    if (!data) return { status: 400, body: null };
    const query = data.shareToken ? `?share_token=${encodeURIComponent(data.shareToken)}` : "";
    const res = await fetch(
      `${requestOrigin()}/api/observer/${encodeURIComponent(data.projectId)}${query}`,
    );
    return { status: res.status, body: await res.json().catch(() => null) };
  });

export const Route = createFileRoute("/app/o/$projectId")({
  validateSearch: (search: Record<string, unknown>) => ({
    share_token: typeof search.share_token === "string" ? search.share_token : undefined,
  }),
  loaderDeps: ({ search }) => ({ shareToken: search.share_token }),
  loader: async ({ params, deps }) => {
    return fetchObserverFn({
      data: { projectId: params.projectId, shareToken: deps.shareToken },
    });
  },
  component: ObserverPage,
});

function ObserverPage() {
  const data = Route.useLoaderData();
  const router = useRouter();

  const body = data.body as {
    project?: { id: string; name: string; stage?: string };
    entities?: {
      id: string;
      name: string;
      contact?: string;
      status: string;
      missing: string[];
      updatedAt: string;
    }[];
    access?: { expiresAt: number | null; sharedByName?: string | null };
  } | null;

  const state = data.status === 200 ? "ready" : data.status === 401 ? "unauthorized" : "error";

  return (
    <ObserverView
      state={state}
      project={body?.project}
      entities={body?.entities ?? []}
      sharedByName={body?.access?.sharedByName}
      expiresAt={body?.access?.expiresAt}
      onRetry={() => void router.invalidate()}
    />
  );
}
