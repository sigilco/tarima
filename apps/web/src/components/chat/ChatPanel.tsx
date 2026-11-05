/**
 * The eve chat panel (screen chat-1): header, message list, tool chips,
 * approval block, composer. Built on AI Elements primitives, adapted to
 * eve's own message model (EveMessage), not the AI SDK UIMessage shape.
 */
import * as m from "#/paraglide/messages.js";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "#/components/ai-elements/conversation.tsx";
import { Message, MessageContent } from "#/components/ai-elements/message.tsx";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage,
} from "#/components/ai-elements/prompt-input.tsx";
import type { EveMessage } from "eve/react";
import { PlusIcon, XIcon } from "lucide-react";
import { useState } from "react";

import { ChatToolChip } from "./ChatToolChip";
import { ChatApproval } from "./ChatApproval";
import type { ChatAgent } from "./useChatAgent";

function ChatMessage({ message }: { message: EveMessage }) {
  const failed = message.metadata?.status === "failed";
  return (
    <Message from={message.role}>
      <MessageContent className={failed ? "border border-destructive/40" : undefined}>
        {message.parts.map((part, index) => {
          if (part.type === "text") {
            return (
              <p key={part.id ?? `${message.id}-text-${index}`} className="whitespace-pre-wrap">
                {part.text}
              </p>
            );
          }
          if (part.type === "tool") {
            return <ChatToolChip key={part.callId} part={part} />;
          }
          return null;
        })}
        {failed ? <p className="text-xs text-destructive">{m["chat.unavailable"]()}</p> : null}
      </MessageContent>
    </Message>
  );
}

export function ChatPanel({
  agent,
  hasProject,
  onClose,
}: {
  agent: ChatAgent;
  hasProject: boolean;
  onClose: () => void;
}) {
  const busy = agent.isStreaming;
  const [approvalAnswering, setApprovalAnswering] = useState(false);

  const handleSubmit = async (message: PromptInputMessage) => {
    const text = message.text?.trim();
    if (!text || busy) return;
    await agent.send(text);
  };

  return (
    <div
      data-slot="chat-panel"
      className="flex h-125 w-100 flex-col overflow-hidden rounded-xl border border-border bg-background shadow-lg"
    >
      <header className="flex items-center gap-2 border-b border-border px-3 py-2">
        <span className="text-sm font-medium">{m["chat.title"]()}</span>
        {agent.sessionId ? (
          <span className="truncate font-mono text-xs text-muted-foreground">
            {agent.sessionId.slice(0, 8)}
          </span>
        ) : null}
        <div className="ml-auto flex items-center gap-1">
          {agent.sessionIds.length > 1 ? (
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {m["chat.sessions"]()} · {agent.sessionIds.length}
            </span>
          ) : null}
          <button
            type="button"
            aria-label={m["chat.newSession"]()}
            title={m["chat.newSession"]()}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={() => agent.newSession()}
          >
            <PlusIcon className="size-4" />
          </button>
          <button
            type="button"
            aria-label={m["chat.close"]()}
            title={m["chat.close"]()}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={onClose}
          >
            <XIcon className="size-4" />
          </button>
        </div>
      </header>

      <Conversation className="min-h-0 flex-1">
        <ConversationContent className="gap-3 p-3">
          {agent.messages.length === 0 ? (
            <ConversationEmptyState
              title={m["chat.title"]()}
              description={hasProject ? m["chat.emptyProject"]() : m["chat.emptyNoProject"]()}
            />
          ) : (
            agent.messages.map((message) => <ChatMessage key={message.id} message={message} />)
          )}
          {agent.pendingInteractions.map((item) => (
            <ChatApproval
              key={item.interactionId}
              interactionId={item.interactionId}
              request={item.request}
              busy={approvalAnswering || agent.status === "resuming"}
              onAnswer={(answers) => {
                setApprovalAnswering(true);
                void agent
                  .respond(answers)
                  .catch(() => undefined)
                  .finally(() => setApprovalAnswering(false));
              }}
            />
          ))}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t border-border">
        <PromptInput onSubmit={handleSubmit} className="border-none">
          <PromptInputBody>
            <PromptInputTextarea
              placeholder={m["chat.composerPlaceholder"]()}
              aria-label={m["chat.composerPlaceholder"]()}
            />
          </PromptInputBody>
          <PromptInputFooter>
            <span className="text-xs text-muted-foreground">
              {busy ? m["chat.streaming"]() : ""}
            </span>
            <PromptInputSubmit
              disabled={!busy && false}
              className="ml-auto"
              aria-label={m["chat.send"]()}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
