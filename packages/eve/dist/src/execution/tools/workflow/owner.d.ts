import { type WorkflowToolRunMessage, type WorkflowToolRunRequestMessage, type WorkflowToolRelay } from "#execution/tools/workflow/messages.js";
import { type ChannelReader } from "#execution/tools/workflow/owner-channels.js";
/**
 * The run's inbox as its body sees it. Everything the body sends its session,
 * except the outcome, goes through the run, which relays each message before
 * the outcome.
 */
export interface WorkflowToolRunInbox {
    /** Messages that reached the run's inbox so far. */
    readonly sent: number;
    send(message: WorkflowToolRunBodyMessage): Promise<void>;
}
/** What a body sends its session through the run: everything but the outcome, which the run sends. */
type WorkflowToolRunBodyMessage = Exclude<WorkflowToolRunMessage, {
    readonly kind: "outcome";
}>;
export interface WorkflowToolRunOwnerInbox {
    readonly owner: WorkflowToolRunInbox;
    /** What was sent since the last read, in order, up to a batch's size cap. */
    readonly reader: ChannelReader<"workflow", WorkflowToolRunBodyMessage[]>;
}
/**
 * Receives body messages before routing them to the waiting turn. The body
 * and the run share one workflow, which replays both deterministically, so
 * the inbox is an in-memory queue; a durable hop would add a step and a
 * replay to every message. The run relays what queued up together, within a
 * size cap, so a fan-out's messages share a relay. A relay can run before hooks created in
 * the same suspension are registered, so a body that hands the session a
 * hook token registers that hook before sending it.
 */
export declare function openWorkflowToolRunOwnerInbox(): WorkflowToolRunOwnerInbox;
/** Acknowledge only step-owned events, after delivery or deliberate discard. */
export declare function deliverWorkflowRelay(message: WorkflowToolRunRequestMessage & {
    readonly request: WorkflowToolRelay;
}, deliver: () => Promise<void>): Promise<void>;
export {};
