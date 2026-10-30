import { createFileRoute, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import * as m from "../../../paraglide/messages.js";
import { AddRowModal } from "../../../components/AddRowModal";
import { BoardHeader } from "../../../components/BoardHeader";
import { BoardTable } from "../../../components/BoardTable";
import { CsvModal } from "../../../components/CsvModal";
import { RowModal } from "../../../components/RowModal";
import { InboxPanel } from "../../../components/InboxPanel";
import { boardView, parseFilter } from "../../../lib/board";
import { briefLine } from "../../../lib/brief";
import { projectBrief } from "../../../lib/api";
import { boardLive, bumpBoardRevision } from "../../../lib/stores";
import {
  addRow,
  bulkIntake,
  eventsUrl,
  startChase,
  UnauthorizedError,
  unwrap,
} from "../../../lib/api";
import { fetchBoardFn, fetchInboxFn } from "../../../lib/api-server";
import type { InboxPayload } from "../../../lib/api";

/**
 * /app/p/$projectId (Stage 5, T5.2): the chase board of screens/board.md.
 *
 * URL state:
 *   ?filter=<bucket>   the status bucket the table shows
 *   ?row=<entityId>    the detail modal (screens/row-modal.md)
 *   ?csv=open          the csv import modal
 *   ?add=open          the manual add-row modal
 *
 * The loader fetches the board payload (project, rows, bucket counts) on
 * the server. The SSE stream then keeps it fresh: every event bumps the
 * revision atom and invalidates the route, so the loader refetches with
 * the URL unchanged.
 */

export const Route = createFileRoute("/app/p/$projectId")({
  validateSearch: (search: Record<string, unknown>) => ({
    filter: typeof search.filter === "string" ? search.filter : undefined,
    row: typeof search.row === "string" ? search.row : undefined,
    csv: typeof search.csv === "string" ? search.csv : undefined,
    add: typeof search.add === "string" ? search.add : undefined,
  }),
  loader: async ({ params }) => {
    try {
      const board = unwrap(await fetchBoardFn({ data: params.projectId }));
      // The inbox is optional on the board: a failed inbox read must
      // not take the board down.
      let inbox: InboxPayload = { messages: [], unread: 0 };
      try {
        inbox = unwrap(await fetchInboxFn());
      } catch {
        // Keep the empty inbox.
      }
      return { ...board, inbox };
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw redirect({ to: "/login", search: { step: "email", email: "" } });
      }
      throw error;
    }
  },
  component: Board,
});

function Board() {
  const { projectId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();
  const payload = Route.useLoaderData();

  const filter = parseFilter(search.filter);
  const { visible, buckets } = boardView(payload.entities, filter);
  const [live, setLive] = useState<"connecting" | "live" | "down">("connecting");
  const [notice, setNotice] = useState<string | null>(null);

  // The live stream keeps the board fresh: every event invalidates the
  // route, so the loader refetches the payload with the URL unchanged.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const source = new EventSource(eventsUrl(projectId));

    const onBoard = () => {
      bumpBoardRevision();
      void router.invalidate();
    };
    source.addEventListener("board", onBoard);
    source.addEventListener("open", () => setLive("live"));
    source.addEventListener("error", () => setLive("down"));

    return () => {
      source.removeEventListener("board", onBoard);
      source.close();
    };
  }, [projectId, router]);

  useEffect(() => {
    boardLive.set(live);
  }, [live]);

  const row = search.row ? payload.entities.find((entity) => entity.id === search.row) : undefined;

  function openCsv() {
    navigate({
      to: "/app/p/$projectId",
      params: { projectId },
      search: { filter: search.filter, row: undefined, csv: "open", add: undefined },
    });
  }

  function closeCsv() {
    navigate({
      to: "/app/p/$projectId",
      params: { projectId },
      search: { filter: search.filter, row: undefined, csv: undefined, add: undefined },
    });
  }

  function openAdd() {
    navigate({
      to: "/app/p/$projectId",
      params: { projectId },
      search: { filter: search.filter, row: undefined, csv: undefined, add: "open" },
    });
  }

  async function onImport(csv: string) {
    const result = await bulkIntake(projectId, csv);
    bumpBoardRevision();
    void router.invalidate();
    return result;
  }

  async function onAddRow(input: {
    name: string;
    contact?: string;
    channel?: "email" | "telegram" | "manual";
    missing?: string[];
  }) {
    await addRow(projectId, input);
    bumpBoardRevision();
    void router.invalidate();
  }

  async function onStartChase() {
    try {
      const { runs } = await startChase(projectId);
      setNotice(
        runs.length > 0
          ? m["chase.started"]({ count: String(runs.length) })
          : m["chase.nothingToDo"](),
      );
      bumpBoardRevision();
      void router.invalidate();
    } catch {
      setNotice(m["errors.offline"]());
    }
  }

  return (
    <main className="grain min-h-[100dvh] bg-surface px-5 py-8 text-content lg:px-8">
      <div className="mx-auto max-w-5xl">
        <BoardHeader
          projectId={projectId}
          projectName={payload.project.name}
          briefLine={briefLine(projectBrief(payload.project))}
          buckets={buckets}
          live={live}
          onImport={openCsv}
          onAddRow={openAdd}
        />

        <div className="flex flex-wrap items-center justify-between gap-3 py-5">
          <div className="flex flex-wrap items-center gap-2">
            <FilterLink
              projectId={projectId}
              active={filter === "all"}
              label={m["board.all"]()}
              bucket={undefined}
            />
            {buckets.map(({ bucket }) => (
              <FilterLink
                key={bucket}
                projectId={projectId}
                active={filter === bucket}
                label={bucket}
                bucket={bucket}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={onStartChase}
            className="rounded-full bg-content px-4 py-2 text-[13px] font-medium text-surface transition-transform duration-300 ease-[cubic-bezier(0.34,1.4,0.4,1)] hover:scale-[1.02] active:scale-[0.98]"
          >
            {m["board.startChase"]()}
          </button>
        </div>

        {notice ? (
          <p className="mb-4 rounded-2xl bg-surface-raised px-4 py-2.5 text-[13px] text-content-muted">
            {notice}
          </p>
        ) : null}

        <BoardTable
          projectId={projectId}
          rows={visible}
          filter={filter}
          emptyFiltered={filter !== "all"}
        />

        <InboxPanel messages={payload.inbox.messages} unread={payload.inbox.unread} />
      </div>

      {row ? <RowModal projectId={projectId} row={row} filter={filter} /> : null}

      {search.csv === "open" ? (
        <CsvModal projectId={projectId} filter={filter} onImport={onImport} onClose={closeCsv} />
      ) : null}

      {search.add === "open" ? (
        <AddRowModal projectId={projectId} filter={filter} onAdd={onAddRow} />
      ) : null}
    </main>
  );
}

function FilterLink({
  projectId,
  active,
  label,
  bucket,
}: {
  projectId: string;
  active: boolean;
  label: string;
  bucket: string | undefined;
}) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() =>
        navigate({
          to: "/app/p/$projectId",
          params: { projectId },
          search: {
            filter: bucket,
            row: undefined,
            csv: undefined,
            add: undefined,
          },
        })
      }
      className={`rounded-full px-3.5 py-1.5 text-[12.5px] ring-1 transition-colors ${
        active
          ? "bg-content text-surface ring-content"
          : "bg-surface-raised text-content-muted ring-border-subtle hover:text-content"
      }`}
    >
      {label}
    </button>
  );
}
