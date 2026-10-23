/**
 * chat-brief: the agent posts a morning brief in chat. Bubbles appear
 * sequentially (staggered fade + 8px rise), a typing indicator bridges
 * the beats, then a summary bubble lists DEMO_ROWS with status pills.
 * ~10.5s loop with a visible rest state at the end.
 */
import { motion } from "motion/react";
import { DEMO_ROWS } from "../../lib/demo-fixtures.js";
import { appear, ChatBubble, phase, PreviewRow, TypingDots, usePreviewLoop } from "./shared";

const CYCLE = 10_500;

export function ChatBriefPreview() {
  const { t, reduced } = usePreviewLoop(CYCLE);
  const brief = DEMO_ROWS.slice(0, 3);

  return (
    <div className="flex h-full flex-col gap-2 overflow-hidden bg-paper px-4 pt-3 pb-4">
      <p className="text-[10px] font-semibold tracking-[0.1em] text-muted uppercase">Today 8:00</p>
      <ChatBubble sender="You" align="right" presence={appear(t, 0, CYCLE, reduced)}>
        Morning — where are we on Summit 2026?
      </ChatBubble>

      <TypingDots presence={appear(t, 600, 1500, reduced)} />

      <ChatBubble sender="Tarima" presence={appear(t, 1600, CYCLE, reduced)}>
        Good morning. Overnight: 2 sponsors answered, 1 venue needs your sign-off. Here's the short
        version:
      </ChatBubble>

      <motion.div
        animate={appear(t, 2400, CYCLE, reduced)}
        transition={phase}
        className="flex flex-col gap-1.5 rounded-2xl border border-line bg-white p-2.5"
        style={{ alignSelf: "flex-start", width: "100%" }}
      >
        <div className="mb-0.5 text-[10px] font-semibold tracking-wide text-muted uppercase">
          Board — top 3
        </div>
        {brief.map((row) => (
          <PreviewRow key={row.id} name={row.name} channel={row.channel} status={row.status} />
        ))}
      </motion.div>

      <ChatBubble sender="Tarima" presence={appear(t, 3400, CYCLE, reduced)}>
        Want me to chase Harbourview again, or hold for your review?
      </ChatBubble>
    </div>
  );
}
