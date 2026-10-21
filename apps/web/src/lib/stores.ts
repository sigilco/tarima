/**
 * Nanostores wiring pattern (T0.4). Store modules export atoms + computed
 * maps; components subscribe via the useStore hook of nanostores' react
 * binding (or read the raw value in a loader). Cross-cutting server state
 * flows through route loaders into atoms, never fetched inside useEffect.
 *
 * Stage 5 (T5.2) adds the board's live-update signal: the SSE listener
 * bumps `boardRevision` and the board route reads the atom in its loader
 * deps, so a bump re-runs the loader with the same URL.
 */
import { atom, computed } from "nanostores";

/** Board row filter state, mirrored to the URL by TanStack validateSearch. */
export const statusFilter = atom<string | null>(null);

/** All rows for the active project; route loaders write into this. */
export const boardRows = atom<BoardRow[]>([]);

export interface BoardRow {
  id: string;
  name: string;
  contact: string | null;
  status: string;
  missing: string[];
  lastActivity: string;
}

/** Filtered view the board table renders; recomputes on either atom. */
export const visibleRows = computed([boardRows, statusFilter], (rows, status) =>
  status ? rows.filter((r) => r.status === status) : rows,
);

/**
 * How many board updates the SSE stream has delivered. The board route
 * subscribes its loaderDeps to this atom: on every bump the loader
 * refetches the board payload with the URL unchanged.
 */
export const boardRevision = atom(0);

/** The SSE connection state, for the live indicator in the board header. */
export const boardLive = atom<"connecting" | "live" | "down">("connecting");

/** Bump the revision after a board event arrived. */
export function bumpBoardRevision(): void {
  boardRevision.set(boardRevision.get() + 1);
}
