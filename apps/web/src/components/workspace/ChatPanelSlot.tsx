import type { ReactNode } from "react";

import * as m from "#/paraglide/messages.js";

/**
 * The reserved container for the eve chat panel (screens workspace-1).
 *
 * SP4 mounts <ChatPanel/> as this component's children; until then the
 * slot renders its own empty-state copy so the layout is real.
 * TODO(SP4): wire <ChatPanel/> (work/sp3-agent branch) in as children.
 */
export function ChatPanelSlot({ children }: { children?: ReactNode }) {
  return (
    <section
      data-slot="chat-panel-slot"
      className="mt-6 flex min-h-40 flex-col rounded-xl border border-dashed border-border bg-muted/40 p-4"
    >
      {children ?? (
        <div className="flex flex-1 items-center justify-center text-center">
          <div>
            <p className="text-sm text-muted-foreground">{m["workspace.chatSlotTitle"]()}</p>
            <p className="mt-1 text-xs text-muted-foreground/70">{m["workspace.chatSlotHint"]()}</p>
          </div>
        </div>
      )}
    </section>
  );
}
