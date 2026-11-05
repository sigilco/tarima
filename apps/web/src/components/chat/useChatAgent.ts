/**
 * The panel's surface over eve's React binding.
 *
 * Transport: `useEveAgent({ baseUrl: "/api/eve" })` — the same-origin
 * nitro proxy (`lib/api-handlers/eve-proxy.ts`) that streams to the
 * in-process eve runtime. The browser sends `tarima_session`
 * automatically; the proxy forwards it and eve's channel auth resolves
 * the principal. No client-side identity is minted.
 *
 * Project scope: the route's `projectId` (when on /app/w/$projectId)
 * rides every send as `clientContext`, so the agent's tools scope to
 * that project. With no project selected the context says so.
 */
import { useEveAgent } from "eve/react";
import { openInteractions } from "eve/events";
import { useCallback, useMemo, useState } from "react";

export interface ChatAgentOptions {
  /** The project the panel is scoped to, or undefined on /app. */
  projectId?: string;
}

export function useChatAgent({ projectId }: ChatAgentOptions) {
  const agent = useEveAgent({
    baseUrl: "/api/eve",
    prepareSend: (input) =>
      ({
        ...input,
        clientContext: projectId
          ? { route: `/app/w/${projectId}`, projectId }
          : { route: "/app", note: "No project selected; answers are not scoped to a project." },
      }) as typeof input,
  });

  const [sessionIds, setSessionIds] = useState<string[]>([]);
  const currentSessionId = agent.session?.sessionId;

  // Track the sessions this panel has seen for the header switcher.
  if (currentSessionId && !sessionIds.includes(currentSessionId)) {
    setSessionIds((prev) => [...prev, currentSessionId]);
  }

  const send = useCallback(
    async (text: string) => {
      await agent.send([{ type: "text", text }]);
    },
    [agent],
  );

  const pendingInteractions = useMemo(
    () =>
      openInteractions(agent.view).filter(
        (item) => item.request.kind !== "sign-in" && item.answer === undefined,
      ),
    [agent.view],
  );

  return {
    messages: agent.messages,
    status: agent.status,
    error: agent.error,
    send,
    respond: agent.respond,
    cancel: agent.cancel,
    newSession: agent.newSession,
    isStreaming: agent.status === "busy",
    pendingInteractions,
    sessionId: currentSessionId,
    sessionIds,
  };
}

export type ChatAgent = ReturnType<typeof useChatAgent>;
