/**
 * Pure board rules (Stage 5, T5.2): bucketing, filtering, sorting and
 * relative-time formatting over an already-loaded payload. No DOM, no
 * fetch: everything here is testable in plain node (see board.test.ts).
 *
 * The bucket rules mirror `apps/api/src/lib/board.ts` so the header chips
 * the SSR payload carries and the chips the client recomputes agree.
 */
import { BOARD_STATUS, type BoardStatus, type ChaseRowState } from "@tarima/contract";

/** One board row, in the wire shape the api returns. */
export interface BoardRow {
  id: string;
  projectId: string;
  name: string;
  contact?: string;
  channel?: string;
  status: ChaseRowState;
  missing: string[];
  createdAt: string;
  updatedAt: string;
}

/** The bucket a wire row state belongs to. */
export type BoardBucket = BoardStatus;

/** The filter values the board URL accepts. */
export type BoardFilter = BoardBucket | "all";

/**
 * Wire state -> bucket.
 *
 * The pre-reply states (intake through notifying) are work in progress:
 * they count as "chasing" because the row is being worked. Only a row
 * that answered, that is stuck, or that is finished lands in its own
 * bucket.
 */
const TO_BUCKET: Record<ChaseRowState, BoardBucket> = {
  intake: "chasing",
  outreach: "chasing",
  awaiting_reply: "chasing",
  parsing: "chasing",
  validating: "chasing",
  updating: "chasing",
  notifying: "chasing",
  chasing: "chasing",
  replied: "replied",
  blocked: "blocked",
  done: "done",
};

/** The bucket of a wire row state. Unknown states count as "chasing". */
export function bucketOf(status: ChaseRowState): BoardBucket {
  return TO_BUCKET[status] ?? "chasing";
}

/** A filter value from a raw URL param, or "all" when it is not one. */
export function parseFilter(raw: string | undefined): BoardFilter {
  return BOARD_STATUS.includes(raw as BoardStatus) ? (raw as BoardFilter) : "all";
}

/** The rows that pass the filter. */
export function filterRows(rows: readonly BoardRow[], filter: BoardFilter): BoardRow[] {
  if (filter === "all") return [...rows];
  return rows.filter((row) => bucketOf(row.status) === filter);
}

/**
 * Deterministic board order: the stuck and unreplied work first (blocked,
 * then chasing), the answered rows after, finished last; within a bucket
 * the oldest row leads and the id breaks ties, so the table never
 * reshuffles between two loads of the same data.
 */
const BUCKET_ORDER: Record<BoardBucket, number> = {
  blocked: 0,
  chasing: 1,
  replied: 2,
  done: 3,
};

export function sortRows(rows: readonly BoardRow[]): BoardRow[] {
  return [...rows].toSorted((a, b) => {
    const byBucket = BUCKET_ORDER[bucketOf(a.status)] - BUCKET_ORDER[bucketOf(b.status)];
    if (byBucket !== 0) return byBucket;
    if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? -1 : 1;
    return a.id < b.id ? -1 : 1;
  });
}

/** One bucket's count, as the header chips render it. */
export interface BucketCount {
  bucket: BoardBucket;
  count: number;
}

/** The counts of every bucket, in the contract's declaration order. */
export function countBuckets(rows: readonly BoardRow[]): BucketCount[] {
  const counts = new Map<BoardBucket, number>(BOARD_STATUS.map((bucket) => [bucket, 0]));
  for (const row of rows) {
    const bucket = bucketOf(row.status);
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
  }
  return BOARD_STATUS.map((bucket) => ({ bucket, count: counts.get(bucket) ?? 0 }));
}

/** The filter+sort pipeline the table renders. */
export function boardView(
  rows: readonly BoardRow[],
  filter: BoardFilter,
): { visible: BoardRow[]; buckets: BucketCount[] } {
  return { visible: sortRows(filterRows(rows, filter)), buckets: countBuckets(rows) };
}

/** "2h ago" style relative time for a row's last activity. */
export function relativeTime(iso: string, now: number = Date.now()): string {
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return "";
  const seconds = Math.max(0, Math.round((now - then) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
