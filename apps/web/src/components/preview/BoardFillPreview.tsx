/**
 * board-fill: a mini chase board. A row slides into "Chasing", then its
 * status pill crossfades chasing -> replied -> done while the cell gets a
 * light edge sweep (the .cell-lit pattern from styles.css). Buckets come
 * from the real boardView/bucketOf pipeline over a DEMO_ROWS subset.
 * ~12s loop with a visible rest state at the end.
 */
import { motion } from "motion/react";
import { DEMO_ROWS } from "../../lib/demo-fixtures.js";
import { boardView, bucketOf, type BoardRow } from "../../lib/board.js";
import type { ChaseRowState } from "@tarima/contract";
import { phase, PreviewRow, spring, StatusPill, usePreviewLoop } from "./shared";

const CYCLE = 12_000;

/** Timeline beats (ms). */
const SLIDE_IN = 700;
const TO_REPLIED = 3000;
const TO_DONE = 5600;
const SWEEP = 6000;
const SWEEP_END = 8600;

/** The row that flies the chase. */
const FEATURED_ID = "row-atlasav";

/** The static subset the board buckets are computed from. */
const SUBSET: BoardRow[] = DEMO_ROWS.filter((row) => row.id !== FEATURED_ID);

export function BoardFillPreview() {
  const { t, reduced } = usePreviewLoop(CYCLE);
  const { buckets } = boardView(SUBSET, "all");

  const chasing = SUBSET.filter((row) => bucketOf(row.status) === "chasing");
  const replied = SUBSET.filter((row) => bucketOf(row.status) === "replied");
  const done = SUBSET.filter((row) => bucketOf(row.status) === "done");

  const featured = DEMO_ROWS.find((row) => row.id === FEATURED_ID);
  const featuredStatus: ChaseRowState =
    t >= TO_DONE ? "done" : t >= TO_REPLIED ? "replied" : "chasing";

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden bg-paper px-4 pt-3 pb-4">
      <div className="flex items-center gap-1.5">
        {buckets
          .filter((b) => b.bucket !== "blocked")
          .map((b) => (
            <span
              key={b.bucket}
              className="rounded-full border border-line bg-white px-2 py-0.5 text-[10px] font-medium text-muted capitalize"
            >
              {b.bucket} {b.count + (b.bucket === "chasing" ? 1 : 0)}
            </span>
          ))}
      </div>

      <section className="flex flex-col gap-1.5">
        <h3 className="text-[10px] font-semibold tracking-[0.1em] text-muted uppercase">Chasing</h3>
        {chasing.map((row) => (
          <PreviewRow key={row.id} name={row.name} channel={row.channel} status={row.status} />
        ))}
        {featured ? (
          <FeaturedRow name={featured.name} status={featuredStatus} t={t} reduced={reduced} />
        ) : null}
      </section>

      <section className="flex flex-col gap-1.5">
        <h3 className="text-[10px] font-semibold tracking-[0.1em] text-muted uppercase">Replied</h3>
        {replied.map((row) => (
          <PreviewRow key={row.id} name={row.name} channel={row.channel} status={row.status} />
        ))}
      </section>

      <section className="flex flex-col gap-1.5">
        <h3 className="text-[10px] font-semibold tracking-[0.1em] text-muted uppercase">Done</h3>
        {done.map((row) => (
          <PreviewRow key={row.id} name={row.name} channel={row.channel} status={row.status} />
        ))}
      </section>
    </div>
  );
}

/**
 * The featured row slides in from the right, then its pill crossfades
 * through the chase. The row stays in the "Chasing" bucket so nothing
 * reflows mid-animation; only the pill and the cell edge sweep change.
 */
function FeaturedRow({
  name,
  status,
  t,
  reduced,
}: {
  name: string;
  status: ChaseRowState;
  t: number;
  reduced: boolean;
}) {
  const visible = reduced || t >= SLIDE_IN;
  const sweeping = !reduced && t >= SWEEP && t < SWEEP_END;

  return (
    <div className={sweeping ? "cell-lit" : undefined}>
      <motion.div
        animate={visible ? { opacity: 1, x: 0 } : { opacity: 0, x: 16 }}
        transition={spring}
      >
        <div className="flex items-center justify-between gap-2 rounded-xl border border-line bg-white px-3 py-2">
          <span className="flex min-w-0 items-center gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-dim text-muted">
              <MailGlyph />
            </span>
            <span className="truncate text-xs font-medium text-ink">{name}</span>
          </span>
          <PillCrossfade status={status} t={t} />
        </div>
      </motion.div>
    </div>
  );
}

/** The three pill states, stacked and crossfaded by opacity only. */
function PillCrossfade({ status, t }: { status: ChaseRowState; t: number }) {
  const order: ChaseRowState[] = ["chasing", "replied", "done"];
  return (
    <span className="relative inline-flex shrink-0">
      {order.map((state) => (
        <motion.span
          key={state}
          className="absolute inset-0"
          animate={{ opacity: state === status ? 1 : 0 }}
          transition={phase}
        >
          <StatusPill status={state} pulse={state === "chasing" && t < TO_REPLIED} />
        </motion.span>
      ))}
      {/* keeps the pill's width stable while the labels crossfade */}
      <span className="invisible">
        <StatusPill status={status} />
      </span>
    </span>
  );
}

function MailGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="size-3.5"
      aria-hidden
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m22 7-10 6L2 7" />
    </svg>
  );
}
