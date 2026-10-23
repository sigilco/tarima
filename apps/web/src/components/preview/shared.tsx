/**
 * Shared atoms for the phone preview variations: a loop clock, row/bubble
 * primitives and the status-tone map. Motion rules: transform/opacity only,
 * motion springs, one thing moves at a time, `useReducedMotion` shows the
 * final state with no loop.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { ChaseRowState } from "@tarima/contract";

/**
 * A looping preview timeline: `t` is the elapsed ms inside a cycle of
 * `durationMs`. With reduced motion the clock stops and `reduced` is true;
 * variations then render their final state and never loop.
 */
export function usePreviewLoop(durationMs: number): { t: number; reduced: boolean } {
  const reduced = Boolean(useReducedMotion());
  const [t, setT] = useState(reduced ? durationMs : 0);
  const raf = useRef(0);
  useEffect(() => {
    if (reduced) {
      setT(durationMs);
      return;
    }
    let start = 0;
    const tick = (now: number) => {
      if (start === 0) start = now;
      setT((now - start) % durationMs);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [durationMs, reduced]);
  return { t, reduced };
}

/** True once the timeline passed `atMs`. */
export const after = (t: number, atMs: number) => t >= atMs;

/**
 * Presence of a timeline item: it appears at `at`, stays visible until
 * `out`, then fades out so the next cycle can start clean. Only opacity
 * and y (transform) are produced.
 */
export function appear(t: number, at: number, out: number, reduced = false): Presence {
  if (reduced) return { opacity: 1, y: 0 };
  if (t >= out) return { opacity: 0, y: -4 };
  if (t >= at) return { opacity: 1, y: 0 };
  return { opacity: 0, y: 8 };
}

/** Shared spring for enter/exit choreography. */
export const spring = { type: "spring" as const, stiffness: 380, damping: 30 };

/** Short tween used for timeline-driven values (a spring would lag behind). */
export const phase = { duration: 0.35, ease: [0.32, 0.72, 0, 1] } as const;

/** Visual tone of a status, keyed by board bucket-ish grouping. */
export const statusTone: Record<string, { label: string; className: string }> = {
  chasing: { label: "Chasing", className: "bg-surface-dim text-muted border-line" },
  calling: { label: "Calling", className: "bg-ink text-white border-ink" },
  notifying: { label: "Notifying", className: "bg-ink text-white border-ink" },
  awaiting_review: { label: "Awaiting review", className: "bg-lavender text-ink border-lavender" },
  replied: { label: "Replied", className: "bg-surface-dim text-ink border-line" },
  done: { label: "Done", className: "bg-mint text-ink border-mint" },
};

/** Wire state -> demo tone (notifying gets the ink tone, validating the tint). */
export function toneOf(status: ChaseRowState) {
  if (status === "notifying") return statusTone.notifying;
  if (status === "validating") return statusTone.awaiting_review;
  if (status === "done") return statusTone.done;
  if (status === "replied") return statusTone.replied;
  return statusTone.chasing;
}

/** A status pill; `pulse` adds a blinking dot (calling/notifying tones). */
export function StatusPill({ status, pulse = false }: { status: ChaseRowState; pulse?: boolean }) {
  const reduced = useReducedMotion();
  const tone = toneOf(status);
  const dot = pulse ? (
    <motion.span
      className="inline-block size-1.5 rounded-full bg-white"
      animate={reduced ? { opacity: 1 } : { opacity: [1, 0.25, 1] }}
      transition={{ duration: 1.2, repeat: reduced ? 0 : Infinity, ease: "easeInOut" }}
    />
  ) : null;
  return (
    <span
      className={`pill inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium leading-tight ${tone.className}`}
    >
      {dot}
      {tone.label}
    </span>
  );
}

/** Phone handset icon, simple inline SVG. */
export function PhoneIcon({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z"
      />
    </svg>
  );
}

/** Envelope icon, simple inline SVG. */
export function MailIcon({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      aria-hidden
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m22 7-10 6L2 7" />
    </svg>
  );
}

/** Timeline-driven opacity/offset for a motion element. */
export interface Presence extends Record<"opacity" | "y", number> {}

/**
 * One board row: name + channel icon left, status pill right.
 * Channel "phone" shows the handset, anything else the envelope.
 */
export function PreviewRow({
  name,
  channel,
  status,
  pulse = false,
  presence,
}: {
  name: string;
  channel?: string;
  status: ChaseRowState;
  pulse?: boolean;
  presence?: Presence;
}) {
  return (
    <motion.div
      animate={presence ?? { opacity: 1, y: 0 }}
      transition={presence ? phase : spring}
      className="flex items-center justify-between gap-2 rounded-xl border border-line bg-white px-3 py-2"
    >
      <span className="flex min-w-0 items-center gap-2">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-dim text-muted">
          {channel === "phone" ? <PhoneIcon /> : <MailIcon />}
        </span>
        <span className="truncate text-xs font-medium text-ink">{name}</span>
      </span>
      <StatusPill status={status} pulse={pulse} />
    </motion.div>
  );
}

/** A chat bubble: sender label + text, white on paper with a hairline border. */
export function ChatBubble({
  sender,
  children,
  align = "left",
  presence,
}: {
  sender: string;
  children: ReactNode;
  align?: "left" | "right";
  presence?: Presence;
}) {
  return (
    <motion.div
      animate={presence ?? { opacity: 1, y: 0 }}
      transition={presence ? phase : spring}
      className="max-w-[85%] rounded-2xl border border-line bg-white px-3 py-2"
      style={{
        alignSelf: align === "right" ? "flex-end" : "flex-start",
        borderTopLeftRadius: align === "left" ? 6 : undefined,
        borderTopRightRadius: align === "right" ? 6 : undefined,
      }}
    >
      <div className="mb-0.5 text-[10px] font-semibold tracking-wide text-muted uppercase">
        {sender}
      </div>
      <div className="text-xs leading-snug text-ink">{children}</div>
    </motion.div>
  );
}

/** Three bouncing dots — "the agent is typing". */
export function TypingDots({ presence }: { presence?: Presence }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      animate={presence ?? { opacity: 1, y: 0 }}
      transition={presence ? phase : spring}
      className="flex items-center gap-1 rounded-2xl border border-line bg-white px-3 py-2.5"
      style={{ alignSelf: "flex-start" }}
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-1.5 rounded-full bg-muted"
          animate={reduced ? { opacity: 1, y: 0 } : { opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
          transition={{
            duration: 0.9,
            repeat: reduced ? 0 : Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </motion.div>
  );
}
