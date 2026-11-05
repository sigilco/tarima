import { useState } from "react";

import { ChatBubble } from "#/components/chat/ChatBubble";
import { ChatPanel } from "#/components/chat/ChatPanel";
import {
  approvalInteraction,
  assistantMessage,
  stubAgent,
  toolPart,
  userMessage,
} from "./chat.stub";

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-[100dvh] bg-background">
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  );
}

function OpenPanel(props: Parameters<typeof ChatPanel>[0]) {
  const [open, setOpen] = useState(true);
  return (
    <Frame>
      <p className="text-sm text-muted-foreground">Content column behind the panel.</p>
      {open ? (
        <div className="fixed right-6 bottom-20 z-40">
          <ChatPanel {...props} onClose={() => setOpen(false)} />
        </div>
      ) : (
        <ChatBubble onOpen={() => setOpen(true)} />
      )}
    </Frame>
  );
}

/** chat-closed — the floating launcher only. */
export default {
  Closed: (
    <Frame>
      <p className="text-sm text-muted-foreground">Content column with the launcher bubble.</p>
      <ChatBubble onOpen={() => undefined} />
    </Frame>
  ),

  Empty: (
    <OpenPanel
      agent={stubAgent({ sessionId: "a1b2c3d4e5" })}
      hasProject
      onClose={() => undefined}
    />
  ),

  EmptyNoProject: <OpenPanel agent={stubAgent()} hasProject={false} onClose={() => undefined} />,

  Streaming: (
    <OpenPanel
      agent={stubAgent({
        messages: [
          userMessage("Which sponsors are missing a logo?"),
          assistantMessage(
            [{ type: "text", text: "Two sponsors are still missing a logo: Acme…" }],
            "streaming",
          ),
        ],
        isStreaming: true,
        status: "busy",
        sessionId: "a1b2c3d4e5",
      })}
      hasProject
      onClose={() => undefined}
    />
  ),

  WithTools: (
    <OpenPanel
      agent={stubAgent({
        messages: [
          userMessage("Which sponsors are missing a logo?"),
          assistantMessage([
            toolPart("completed"),
            toolPart("completed", "get_project"),
            { type: "text", text: "Acme Corp and Lumen Studio are missing a logo." },
          ]),
        ],
        sessionId: "a1b2c3d4e5",
      })}
      hasProject
      onClose={() => undefined}
    />
  ),

  Error: (
    <OpenPanel
      agent={stubAgent({
        messages: [
          userMessage("Which sponsors are missing a logo?"),
          {
            ...assistantMessage([{ type: "text", text: "The agent is unavailable." }]),
            metadata: { status: "failed" },
          },
        ],
        sessionId: "a1b2c3d4e5",
      })}
      hasProject
      onClose={() => undefined}
    />
  ),

  Approval: (
    <OpenPanel
      agent={stubAgent({
        messages: [
          userMessage("Email Acme the sponsorship package."),
          assistantMessage([{ type: "text", text: "Draft ready — one approval needed." }]),
        ],
        pendingInteractions: [approvalInteraction()],
        sessionId: "a1b2c3d4e5",
      })}
      hasProject
      onClose={() => undefined}
    />
  ),
};
