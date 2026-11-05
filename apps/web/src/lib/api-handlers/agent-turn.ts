/**
 * POST /api/agent/turn — one authenticated agent turn.
 *
 * Body: `{ sessionId?: string, message: string }`. Response:
 * `{ sessionId, reply, status, toolCalls, transcript }`.
 *
 * The caller must present a valid `tarima_session` cookie: 401 without
 * one — there is no anonymous principal on this surface. Auth itself is
 * enforced by the eve channel (`agent/channels/eve.ts`): the request is
 * forwarded with the caller's own cookie, so eve's route auth verifies
 * it to the same tarima user and stamps that principal onto the session
 * — which is exactly the id the tools scope reads to (`callerUserId`).
 *
 * Transport: eve's built-in HTTP channel (`/eve/v1/*`) reached through
 * the `eve/client` Client against the in-process runtime mount
 * (`agent/runtime.ts`). No custom eve handler exists to reuse.
 */
import { Client } from "eve/client";
import { getEveOrigin } from "./agent-runtime-state";

interface TurnBody {
  sessionId?: string;
  message?: string;
}

export interface AgentToolCall {
  toolName?: string;
  state?: string;
  input?: unknown;
  output?: unknown;
}

export interface AgentTurnResponse {
  sessionId: string;
  reply?: string;
  status: string;
  outcome?: string;
  toolCalls: AgentToolCall[];
}

const TURN_TIMEOUT_MS = Number.parseInt(process.env.TARIMA_AGENT_TURN_TIMEOUT_MS ?? "180000", 10);

export async function handleAgentTurn(request: Request): Promise<Response> {
  const cookie = request.headers.get("cookie");
  const hasSessionCookie = cookie?.includes("tarima_session=") ?? false;
  if (!hasSessionCookie) {
    return Response.json(
      { error: "authentication_required", message: "Sign in to use the agent." },
      { status: 401 },
    );
  }

  let body: TurnBody;
  try {
    body = (await request.json()) as TurnBody;
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  const message = body.message?.trim();
  if (!message) return Response.json({ error: "message_required" }, { status: 400 });

  const origin = await getEveOrigin();
  if (!origin) {
    return Response.json({ error: "agent_unavailable" }, { status: 503 });
  }

  // Forward the caller's own cookie so eve's channel auth resolves the
  // same principal the api handlers see; never mint or widen identity.
  const headers = { cookie: cookie! };

  try {
    const client = new Client({ baseUrl: origin, headers });

    const turnMessage: [{ type: "text"; text: string }] = [{ type: "text", text: message }];
    const delivery = body.sessionId
      ? await client.sessions
          .attach(body.sessionId)
          .send(turnMessage, { headers, signal: AbortSignal.timeout(TURN_TIMEOUT_MS) })
      : (await client.sessions.create({ message: turnMessage, headers })).delivery;

    const result = await delivery.result({
      signal: AbortSignal.timeout(TURN_TIMEOUT_MS),
    });

    // Tool calls come from the session stream, not the delivery summary:
    // eve publishes them as `call.requested` (the model asked for a
    // capability) and `call.settled` (it finished).
    const session = client.sessions.attach(delivery.sessionId);
    const parts: AgentToolCall[] = [];
    for await (const event of session.stream({ follow: false })) {
      const fact = event as unknown as { type?: string; data?: Record<string, unknown> };
      if (fact.type === "call.requested") {
        const capability = fact.data?.capability as
          | { kind?: string; name?: string; label?: string }
          | undefined;
        parts.push({
          toolName: capability?.name ?? capability?.label,
          state: "requested",
          input: fact.data?.input,
        });
      } else if (fact.type === "call.settled") {
        const capability = fact.data?.capability as
          | { kind?: string; name?: string; label?: string }
          | undefined;
        parts.push({
          toolName: capability?.name ?? capability?.label,
          state: "settled",
          output: fact.data?.output,
        });
      }
    }

    const response: AgentTurnResponse = {
      sessionId: delivery.sessionId,
      reply: result.reply,
      status: result.status,
      outcome: result.outcome,
      toolCalls: parts,
    };
    return Response.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Eve channel auth rejections arrive as ClientError with a status.
    const status =
      typeof err === "object" && err !== null && "status" in err && typeof err.status === "number"
        ? err.status
        : 502;
    if (status === 401) {
      return Response.json({ error: "authentication_required", message }, { status: 401 });
    }
    return Response.json({ error: "agent_turn_failed", message }, { status });
  }
}
