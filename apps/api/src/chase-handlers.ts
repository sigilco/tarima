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
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { chaseHandlers } from "@tarima/chase/handlers";
import type { ChaseLlm } from "@tarima/chase/llm";
import type { HandlerRegistry, StepContext, StepResult } from "@tarima/engine/types";
import { sendApprovedForEntity } from "./services/approval";
import { db } from "./db";
import { entities, events } from "./db/schema";

/** Delay before the first follow-up goes out (48h, the SFM default). */
const FOLLOW_UP_DELAY_MS = Number(process.env.ENGINE_FOLLOW_UP_DELAY_MS ?? 48 * 60 * 60 * 1000);

/** Delay before re-checking a parse step that beat the gate decision. */
const PARSE_DEFER_DELAY_MS = Number(process.env.ENGINE_PARSE_DEFER_DELAY_MS ?? 1000);

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

  const outreachStaged = async (ctx: StepContext): Promise<StepResult> => {
    // Park path: no gate event in the input means the run just staged
    // its draft. When the project's send gate is already approved (the
    // user approved while this run was still drafting, or approved an
    // earlier chase of the same project run), the draft inherits that
    // approval and is released immediately: one approval per project
    // run, no stranded drafts, still zero unstaged sends (the release
    // goes through the same SEND_APPROVED transition as a click).
    const event = ctx.input.event as string | undefined;
    if (ctx.state === "outreach_staged" && event === undefined) {
      const entityId = ctx.context.entityId;
      if (typeof entityId === "string" && sendApprovedForEntity(entityId)) {
        return releaseWithGuard(ctx, { ...ctx.input, event: "SEND_APPROVED" });
      }
    }
    if (ctx.state === "outreach_staged" && event === "SEND_APPROVED") {
      // The gate decision step: the same release path, and the same
      // no-contact guard.
      return releaseWithGuard(ctx, ctx.input);
    }
    return base["chase.outreach_staged"](ctx);
  };

  /**
   * Release a staged draft and flag the row when the release had no
   * address to send to. The no-contact guard fires inside the chase
   * package: the run finishes `failed` without emitting a send, so the
   * board row is flipped to `blocked` here and reads as needing a
   * contact, never as waiting for a reply.
   */
  const releaseWithGuard = async (
    ctx: StepContext,
    input: Record<string, unknown>,
  ): Promise<StepResult> => {
    const result = await base["chase.outreach_staged"]({ ...ctx, input });
    if (result.output && result.output.blocked === "no_contact") {
      const entityId = ctx.context.entityId;
      if (typeof entityId === "string") flagNoContact(entityId, ctx.context.entityName);
    }
    return result;
  };

  /** Flip a board row to `blocked` with the no-contact flag in its goal bag. */
  const flagNoContact = (entityId: string, name: unknown): void => {
    const row = db.select().from(entities).where(eq(entities.id, entityId)).get();
    if (!row) return;
    const goal = { ...row.goal, missing: ["contact"] };
    db.update(entities)
      .set({ goal, status: "failed", updatedAt: Date.now() })
      .where(eq(entities.id, entityId))
      .run();
    db.insert(events)
      .values({
        id: randomUUID(),
        actor: "engine",
        type: "chase.blocked_no_contact",
        subjectType: "entity",
        subjectId: entityId,
        data: { entityName: typeof name === "string" ? name : row.name },
        createdAt: Date.now(),
      })
      .run();
  };

  const awaitReply = async (ctx: StepContext): Promise<StepResult> => {
    // The gate decision and the keep-alive timer can complete in either
    // order within one runner tick (both snapshot `outreach_staged`), so
    // this entry step may observe a state the decision already advanced.
    // Defer until the state has actually moved to `await_reply`.
    if (ctx.state === "outreach_staged") {
      return {
        output: { deferred: true, state: ctx.state },
        nextSteps: [{ key: "chase.await_reply", input: ctx.input, delayMs: PARSE_DEFER_DELAY_MS }],
      };
    }

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
    // auto-completed by the engine). No nextState: the state is
    // already `await_reply` (written by whichever step transitioned
    // into it), and a stale-snapshot write here could revert a newer
    // state when steps complete out of order.
    return {
      output: { awaiting: true },
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

    // A reply landed for a run the engine already finished (the gate
    // rejected it, or it completed otherwise): do nothing.
    if (ctx.state === "done" || ctx.state === "failed") {
      return { output: { skipped: true, state: ctx.state } };
    }

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

    // The reply beat the gate decision: the run is still parked in
    // `outreach_staged` waiting for the send gate. Parse cannot run yet
    // (the SFM only accepts REPLY_PARSED from `parse`), so defer this
    // step and re-enqueue it until the gate has moved the state on.
    if (ctx.state === "outreach_staged") {
      return {
        output: { deferred: true, state: ctx.state },
        nextSteps: [{ key: "chase.parse", input: ctx.input, delayMs: PARSE_DEFER_DELAY_MS }],
      };
    }

    return base["chase.parse"](ctx);
  };

  return {
    ...base,
    "chase.outreach_staged": outreachStaged,
    "chase.await_reply": awaitReply,
    "chase.parse": parse,
  };
}
