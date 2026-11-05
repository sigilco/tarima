/**
 * An in-panel HITL request (screen chat-1, chat-approval): an approval
 * or question the turn asked, answered through respond(). Renders the
 * request's options as buttons; free-text answers fall back to the
 * composer (a steering message answers the request).
 */
import * as m from "#/paraglide/messages.js";
import { Alert, AlertDescription } from "#/components/ui/alert.tsx";
import { Button } from "#/components/ui/button.tsx";
import type { Interaction } from "eve/react";
import type { Answer } from "eve/events";

export function ChatApproval({
  interactionId,
  request,
  busy,
  onAnswer,
}: {
  interactionId: string;
  request: Interaction["request"];
  busy: boolean;
  onAnswer: (answers: readonly Answer[]) => void;
}) {
  const isApproval = request.kind === "approval";
  return (
    <Alert className="flex flex-col gap-2 border-amber-300 bg-amber-50/60">
      <AlertDescription className="flex flex-col gap-2">
        <span className="text-sm font-medium">
          {isApproval ? m["chat.approvalTitle"]() : (request.title ?? request.prompt)}
        </span>
        {isApproval || request.title ? (
          <span className="text-sm text-muted-foreground">{request.prompt}</span>
        ) : null}
        {request.options && request.options.length > 0 ? (
          <span className="flex gap-2">
            {request.options.map((option) => (
              <Button
                key={option.id}
                type="button"
                size="sm"
                disabled={busy}
                variant={option.style === "danger" ? "destructive" : "default"}
                onClick={() => onAnswer([{ interactionId, optionId: option.id }])}
              >
                {option.label}
              </Button>
            ))}
          </span>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
