/**
 * A deterministic in-memory ChatAgent stub for Cosmos fixtures: no
 * network, no eve runtime. Each fixture preset decides the message list,
 * tool parts, error and pending interactions it shows.
 */
import type { ChatAgent } from "#/components/chat/useChatAgent";
import type { EveMessage, EveToolPart } from "eve/react";

export function userMessage(text: string): EveMessage {
  return { id: "u1", role: "user", parts: [{ type: "text", text }] };
}

export function assistantMessage(
  parts: readonly (EveToolPart | { type: "text"; text: string })[],
  status: "streaming" | "complete" = "complete",
): EveMessage {
  return {
    id: "a1",
    role: "assistant",
    metadata: { status },
    parts: parts.map((part, index): EveMessage["parts"][number] =>
      part.type === "tool"
        ? part
        : {
            id: `t${index}`,
            state: status === "streaming" ? "streaming" : "done",
            type: "text",
            text: part.text,
          },
    ),
  };
}

export function toolPart(state: EveToolPart["state"], name = "list_entities"): EveToolPart {
  const base = {
    type: "tool" as const,
    callId: `call-${name}-${state}`,
    kind: "tool" as const,
    name,
    label: name,
    stepIndex: 0,
  };
  return state === "streaming"
    ? { ...base, state, inputText: '{"projectId": "p1"}' }
    : { ...base, state, input: { projectId: "p1" }, output: { entities: 2 } };
}

export function approvalInteraction(prompt = "Send the sponsorship email to ops@acme.test?") {
  return {
    interactionId: "i1",
    turnId: "t1",
    stepIndex: 0,
    request: {
      kind: "approval" as const,
      prompt,
      options: [
        { id: "approve", label: "Approve", style: "primary" as const },
        { id: "deny", label: "Deny", style: "danger" as const },
      ],
    },
    status: "open" as const,
  };
}

type Override = Partial<
  Pick<ChatAgent, "messages" | "isStreaming" | "status" | "pendingInteractions" | "sessionId">
>;

export function stubAgent(override: Override = {}): ChatAgent {
  return {
    messages: [],
    status: "idle",
    error: undefined,
    send: () => Promise.resolve({} as never),
    respond: () => Promise.resolve({} as never),
    cancel: () => Promise.resolve({} as never),
    newSession: () => undefined,
    isStreaming: false,
    pendingInteractions: [],
    sessionId: undefined,
    sessionIds: [],
    ...override,
  } as ChatAgent;
}
