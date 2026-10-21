/**
 * Chase handlers with the api's wait-for-reply semantics (Stage 4, T4.3).
 *
 * The chase package's `chase.await_reply` handler treats a missing
 * event as "the reply already arrived": it advances the run to `parse`
 * with a placeholder body ("done, everything is attached"). That is a
 * demo shortcut and it breaks the live flow in two ways:
 *
 *   - every run completes right after the outreach email, so no run is
 *     left `running` for the inbound webhook to attach a real reply to
 *   - the reply body would be parsed from the placeholder, not from the
 *     mail that actually came back
 *
 * So the api wraps the registry: `chase.await_reply` parks the run in
 * the `await_reply` state until a reply arrives, and the parked step
 * doubles as the 48h follow-up timer (the child step it enqueues).
 * When a reply lands on the webhook, the `chase.parse` step the
 * webhook enqueued drives the run forward: the wrapper first moves the
 * state from `await_reply` to `parse`, then the real parse handler
 * runs on the body that came back.
 *
 * The chase package itself is untouched.
 */
import { chaseHandlers } from "@tarima/chase/handlers";
import type { ChaseLlm } from "@tarima/chase/llm";
import type { HandlerRegistry, StepContext, StepResult } from "@tarima/engine/types";

/** Delay before the first follow-up goes out (48h, the SFM default). */
const FOLLOW_UP_DELAY_MS = Number(process.env.ENGINE_FOLLOW_UP_DELAY_MS ?? 48 * 60 * 60 * 1000);

/** The state a run waits in while it waits for a reply. */
const AWAIT_REPLY = "await_reply";
/** The state the parse handler expects. */
const PARSE = "parse";

function hasBody(input: Record<string, unknown>): boolean {
  const body = input.body;
  return typeof body === "string" && body.trim().length > 0;
}

/**
 * The handler registry the api's engine runner executes.
 */
export function apiChaseHandlers(llm: ChaseLlm): HandlerRegistry {
  const base = chaseHandlers(llm);

  const awaitReply = async (ctx: StepContext): Promise<StepResult> => {
    // A follow-up timer for a run that has moved on (the reply arrived
    // first): do nothing, the run's state is not `await_reply` anymore.
    if (ctx.state !== AWAIT_REPLY) {
      return { output: { skipped: true, state: ctx.state } };
    }

    // A real reply: drive the state machine forward.
    if (hasBody(ctx.input)) {
      return base["chase.await_reply"]({
        ...ctx,
        input: { ...ctx.input, event: "REPLY_RECEIVED" },
      });
    }

    // A follow-up that came due: let the SFM branch into `followup`.
    if (ctx.input.event === "FOLLOWUP_DUE") {
      return base["chase.await_reply"](ctx);
    }

    // Park the run: no reply yet. The child step is the follow-up
    // timer; it keeps the run alive (a run with no pending steps is
    // auto-completed by the engine).
    return {
      output: { awaiting: true },
      nextState: AWAIT_REPLY,
      nextSteps: [
        {
          key: "chase.await_reply",
          input: { ...ctx.input, event: "FOLLOWUP_DUE" },
          delayMs: FOLLOW_UP_DELAY_MS,
        },
      ],
    };
  };

  const parse = async (ctx: StepContext): Promise<StepResult> => {
    if (ctx.state === PARSE) return base["chase.parse"](ctx);

    // The reply landed while the run waited in `await_reply`: move the
    // state into `parse` first. The base await_reply handler enqueues
    // the parse step as a child (the engine suffixes it when the key
    // is taken), and that child runs the real parse handler.
    if (ctx.state === AWAIT_REPLY) {
      return base["chase.await_reply"]({
        ...ctx,
        input: { ...ctx.input, event: "REPLY_RECEIVED" },
      });
    }

    return base["chase.parse"](ctx);
  };

  return {
    ...base,
    "chase.await_reply": awaitReply,
    "chase.parse": parse,
  };
}
