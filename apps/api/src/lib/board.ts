/**
 * Board bucketing rules (Stage 5, T5.2).
 *
 * The board header shows one chip per bucket: chasing, replied, blocked,
 * done (the contract's `BOARD_STATUS`). The wire vocabulary of a row is
 * finer than four buckets (intake, outreach, awaiting_reply, parsing,
 * validating, updating, notifying, chasing, replied, blocked, done), so
 * every wire state maps into exactly one bucket.
 *
 * The mapping lives here, in the api, so the board endpoint and the web
 * board read the same rule. `apps/web/src/lib/board.ts` mirrors it for
 * the client-side filtering of an already-loaded payload.
 */
import { BOARD_STATUS, type ChaseRowState } from "@tarima/contract";

/** The bucket a wire row state belongs to. */
type BoardBucket = (typeof BOARD_STATUS)[number];

/**
 * Wire state -> bucket.
 *
 * The pre-reply states (intake through notifying) are work in progress:
 * they count as "chasing" because the row is being worked. Only a row
 * that answered, that is stuck, or that is finished lands in its own
 * bucket.
 */
const TO_BUCKET: Record<ChaseRowState, BoardBucket> = {
  candidate: "chasing",
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
function bucketOf(status: ChaseRowState): BoardBucket {
  return TO_BUCKET[status] ?? "chasing";
}

/** One bucket's count, as the header chips render it. */
interface BucketCount {
  bucket: BoardBucket;
  count: number;
}

/** The counts of every bucket, in the contract's declaration order. */
export interface BoardSummary {
  buckets: BucketCount[];
  total: number;
}

/** A row, in the fields the summary needs. */
export interface SummarizableRow {
  status: ChaseRowState;
}

/**
 * Count the rows per bucket. Every bucket is always present (a count of
 * zero is still a chip), and the total counts every row.
 */
export function summarizeBoard(rows: readonly SummarizableRow[]): BoardSummary {
  const counts = new Map<BoardBucket, number>(BOARD_STATUS.map((bucket) => [bucket, 0]));
  for (const row of rows) {
    counts.set(bucketOf(row.status), (counts.get(bucketOf(row.status)) ?? 0) + 1);
  }
  return {
    buckets: BOARD_STATUS.map((bucket) => ({ bucket, count: counts.get(bucket) ?? 0 })),
    total: rows.length,
  };
}
