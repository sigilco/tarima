/**
 * Nanostores wiring pattern (T0.4). Store modules export atoms + computed
 * maps; components subscribe via useAtomValue/useSetAtom from @nanostores/react
 * (or useStore for read-only). Cross-cutting server state flows through
 * hono RPC results written into atoms from route loaders, never fetched
 * inside useEffect.
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
