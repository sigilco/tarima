import type { ChaseRowState } from "@tarima/contract";
import { bucketOf } from "../../lib/board";

/**
 * Shared presentational bits of the /demo routes: a status pill with the
 * same tone mapping as the real board table, restyled freely.
 */

const STATUS_TONE: Record<string, string> = {
  chasing: "bg-accent-soft text-accent-strong",
  replied: "bg-success-soft text-success",
  blocked: "bg-danger-soft text-danger",
  done: "bg-surface-sunken text-content-muted",
};

export function StatusPill({ status }: { status: ChaseRowState }) {
  const bucket = bucketOf(status);
  return (
    <span
      className={`pill inline-block rounded-full px-2.5 py-1 text-[12px] ${
        STATUS_TONE[bucket] ?? STATUS_TONE.chasing
      }`}
    >
      {status}
    </span>
  );
}
