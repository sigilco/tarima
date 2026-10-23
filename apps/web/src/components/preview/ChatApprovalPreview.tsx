/**
 * chat-approval: a human-in-the-loop moment. The agent asks approval to
 * send a sponsor email (bubble + draft card with Send/Reject), after ~2s
 * an approval tick animates on, the draft collapses, and a "Sent"
 * confirmation bubble rises. ~9s loop.
 */
import { motion } from "motion/react";
import { DEMO_ROWS } from "../../lib/demo-fixtures.js";
import { after, appear, ChatBubble, TypingDots, usePreviewLoop } from "./shared";

const CYCLE = 9_000;
const DRAFT_IN = 1400;
const TICK_AT = 4200;
const COLLAPSE = 4900;
const SENT_AT = 5400;

export function ChatApprovalPreview() {
  const { t, reduced } = usePreviewLoop(CYCLE);
  const row = DEMO_ROWS.find((r) => r.id === "row-northwind");
  const approved = after(t, TICK_AT);

  return (
    <div className="flex h-full flex-col gap-2 overflow-hidden bg-paper px-4 pt-3 pb-4">
      <p className="text-[10px] font-semibold tracking-[0.1em] text-muted uppercase">
        Sponsor outreach
      </p>

      <TypingDots presence={appear(t, 0, 900, reduced)} />

      <ChatBubble sender="Tarima" presence={appear(t, 1000, CYCLE, reduced)}>
        {row?.name ?? "Northwind Coffee"} hasn't answered in 2 days. I drafted a follow-up — send
        it?
      </ChatBubble>

      <DraftCard visible={t >= DRAFT_IN && t < COLLAPSE} approved={approved} reduced={reduced} />

      <ApprovalTick on={approved} reduced={reduced} />

      <ChatBubble
        sender="You"
        align="right"
        presence={appear(t, approved ? TICK_AT : CYCLE, CYCLE, reduced)}
      >
        Approve
      </ChatBubble>

      <ChatBubble sender="Tarima" presence={appear(t, SENT_AT, CYCLE, reduced)}>
        <span className="font-medium">Sent.</span> {row?.name ?? "Northwind Coffee"} — follow-up
        emailed just now. I'll flag the reply when it lands.
      </ChatBubble>
    </div>
  );
}

function DraftCard({
  visible,
  approved,
  reduced,
}: {
  visible: boolean;
  approved: boolean;
  reduced: boolean;
}) {
  if (reduced) {
    return null;
  }
  return (
    <motion.div
      animate={
        visible && !approved
          ? { opacity: 1, y: 0, height: "auto" }
          : { opacity: 0, y: -4, height: 0 }
      }
      transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
      className="overflow-hidden"
      style={{ alignSelf: "flex-start", width: "100%" }}
    >
      <div className="rounded-2xl border border-line bg-white p-2.5">
        <div className="mb-1 text-[10px] font-semibold tracking-wide text-muted uppercase">
          Draft · email
        </div>
        <p className="text-xs leading-snug text-ink">
          Hi Northwind team — checking in on the sponsorship tier quote for Summit 2026. Any news
          from your side? Happy to hop on a quick call.
        </p>
        <div className="mt-2 flex gap-1.5">
          <span className="rounded-lg bg-ink px-2.5 py-1 text-[10px] font-semibold text-white">
            Send
          </span>
          <span className="rounded-lg border border-line px-2.5 py-1 text-[10px] font-semibold text-muted">
            Reject
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function ApprovalTick({ on, reduced }: { on: boolean; reduced: boolean }) {
  if (reduced) return null;
  return (
    <motion.div
      className="flex items-center justify-center"
      animate={on ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }}
      transition={{ type: "spring", stiffness: 500, damping: 22 }}
    >
      <span className="flex size-6 items-center justify-center rounded-full bg-mint text-ink">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="size-3.5"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
        </svg>
      </span>
    </motion.div>
  );
}
