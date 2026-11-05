import type { ReactNode } from "react";

import { ChatBubble } from "#/components/chat/ChatBubble";
import { ChatPanel } from "#/components/chat/ChatPanel";
import { useChatAgent } from "#/components/chat/useChatAgent";
import { useState } from "react";

/**
 * The chat mount point in the workspace shell (screens workspace-1 and
 * chat-1): the floating launcher, and the eve panel when open. The
 * project id scopes the agent's tools; on /app (no project) the panel
 * says answers are not scoped.
 */
export function ChatPanelSlot({
  children,
  projectId,
}: {
  children?: ReactNode;
  projectId?: string;
}) {
  const [open, setOpen] = useState(false);
  const agent = useChatAgent({ projectId });

  return (
    <>
      {open ? (
        <div className="fixed right-6 bottom-20 z-40">
          <ChatPanel
            agent={agent}
            hasProject={projectId !== undefined}
            onClose={() => setOpen(false)}
          />
        </div>
      ) : (
        <ChatBubble onOpen={() => setOpen(true)} />
      )}
      {children}
    </>
  );
}
