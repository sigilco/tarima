/**
 * call-transcript: a live call screen. Header "Calling Harbourview Hall"
 * with a pulsing dot, transcript lines appear sequentially (venue / agent
 * alternating), ends with an outcome chip "Venue confirmed — Tue 6pm" in
 * mint. ~11s loop.
 */
import { motion } from "motion/react";
import { PhoneIcon, TypingDots, appear, usePreviewLoop } from "./shared";

const CYCLE = 11_000;
const LINES: { speaker: "Venue" | "Tarima"; text: string; at: number }[] = [
  { speaker: "Venue", text: "Harbourview Hall, events desk — how can I help?", at: 1600 },
  {
    speaker: "Tarima",
    text: "Hi! I'm calling for a private room for 25 on Tuesday the 12th, evening.",
    at: 3200,
  },
  {
    speaker: "Venue",
    text: "We have the Harbour Room free from 6pm. Fits 30, AV included.",
    at: 5000,
  },
  {
    speaker: "Tarima",
    text: "Perfect. Can you hold it and send the package price by email?",
    at: 6600,
  },
  { speaker: "Venue", text: "Done — you'll have it within the hour.", at: 8000 },
];
const OUTCOME_AT = 9200;

export function CallTranscriptPreview() {
  const { t, reduced } = usePreviewLoop(CYCLE);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-paper">
      <div className="flex items-center gap-2 border-b border-line bg-white px-4 py-3">
        <span className="flex size-7 items-center justify-center rounded-full bg-surface-dim text-muted">
          <PhoneIcon />
        </span>
        <div>
          <div className="text-xs font-semibold text-ink">Calling Harbourview Hall</div>
          <CallTimer t={t} reduced={reduced} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-hidden px-4 py-3">
        {LINES.map((line, i) => (
          <TranscriptLine key={i} line={line} t={t} reduced={reduced} out={CYCLE} />
        ))}
        <TypingDots presence={appear(t, LINES[0].at - 900, LINES[0].at + 200, reduced)} />
      </div>

      <OutcomeChip t={t} reduced={reduced} />
    </div>
  );
}

function CallTimer({ t, reduced }: { t: number; reduced: boolean }) {
  const elapsed = Math.max(0, Math.floor(t / 1000));
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  const connected = reduced || t >= 1500;
  return (
    <div className="flex items-center gap-1.5 text-[10px] text-muted">
      <motion.span
        className="inline-block size-1.5 rounded-full bg-ink"
        animate={reduced || connected ? { opacity: 1 } : { opacity: [1, 0.25, 1] }}
        transition={{
          duration: 1.1,
          repeat: reduced || connected ? 0 : Infinity,
          ease: "easeInOut",
        }}
      />
      {connected ? `${mm}:${ss}` : "ringing…"}
    </div>
  );
}

function TranscriptLine({
  line,
  t,
  reduced,
  out,
}: {
  line: (typeof LINES)[number];
  t: number;
  reduced: boolean;
  out: number;
}) {
  return (
    <motion.div
      animate={appear(t, line.at, out, reduced)}
      transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
      className={line.speaker === "Tarima" ? "self-end" : "self-start"}
      style={{ maxWidth: "85%" }}
    >
      <div className="mb-0.5 text-[10px] font-semibold tracking-wide text-muted uppercase">
        {line.speaker}
      </div>
      <div
        className={`rounded-2xl border px-3 py-2 text-xs leading-snug ${
          line.speaker === "Tarima"
            ? "border-ink bg-ink text-white"
            : "border-line bg-white text-ink"
        }`}
      >
        {line.text}
      </div>
    </motion.div>
  );
}

function OutcomeChip({ t, reduced }: { t: number; reduced: boolean }) {
  const on = reduced || t >= OUTCOME_AT;
  return (
    <motion.div
      className="flex justify-center pb-4"
      animate={on ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
    >
      <span className="rounded-full bg-mint px-3 py-1.5 text-[11px] font-semibold text-ink">
        Venue confirmed — Tue 6pm
      </span>
    </motion.div>
  );
}
