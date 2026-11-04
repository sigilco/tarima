/**
 * Negotiation room seam contract.
 *
 * Ported and adapted from tarima2 reference:
 * - Lowercase snake_case statuses with distinct terminal "sent" status.
 * - UUID identifiers and ISO or epoch-ms timestamps.
 * - Discriminated union wire protocol for incoming and outgoing WebSocket frames.
 * - Deal row schema for per-venue negotiation state (decision D9).
 */
import * as v from "valibot";

/**
 * Negotiation lifecycle statuses.
 *
 * Ported from tarima2 VenueStatus:
 * - pending_audit: proposal received, awaiting automated audit
 * - requires_approval: audit complete, waiting for HITL approval
 * - revising: feedback received, negotiator redrafting
 * - counter_proposed: counter approved by client/organizer
 * - accepted: vendor accepted the counter proposal
 * - rejected: venue dropped/declined (terminal)
 * - sent: approved counter was actually dispatched to vendor (terminal)
 */
export const NEGOTIATION_STATUSES = [
  "pending_audit",
  "requires_approval",
  "revising",
  "counter_proposed",
  "accepted",
  "rejected",
  "sent",
] as const;
export const negotiationStatusSchema = v.picklist(NEGOTIATION_STATUSES);
export type NegotiationStatus = v.InferOutput<typeof negotiationStatusSchema>;

/** Roles participating in or observing the negotiation room. */
export const ROOM_ROLES = ["agency", "client", "organizer", "owner", "observer"] as const;
export const roomRoleSchema = v.picklist(ROOM_ROLES);
export type RoomRole = v.InferOutput<typeof roomRoleSchema>;

/** Actors performing actions or generating activity in the room. */
export const ACTIVITY_ACTORS = [
  "scout",
  "finance",
  "negotiator",
  "client",
  "agency",
  "organizer",
  "owner",
  "system",
] as const;
export const activityActorSchema = v.picklist(ACTIVITY_ACTORS);
export type ActivityActor = v.InferOutput<typeof activityActorSchema>;

/**
 * Flexible timestamp schema accepting either ISO 8601 strings or epoch ms integers.
 */
export const timestampSchema = v.union([
  v.pipe(v.string(), v.isoTimestamp()),
  v.pipe(v.number(), v.integer(), v.minValue(0)),
]);
export type Timestamp = v.InferOutput<typeof timestampSchema>;

/** LLM token usage breakdown. */
export const tokensSchema = v.object({
  prompt: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0))),
  completion: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0))),
  total: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0))),
});
export type Tokens = v.InferOutput<typeof tokensSchema>;

/** Attribution for agent-performed actions in the negotiation flow. */
export const agentAttributionSchema = v.object({
  agent: activityActorSchema,
  verb: v.optional(v.pipe(v.string(), v.maxLength(100))),
  model: v.optional(v.pipe(v.string(), v.maxLength(100))),
  latencyMs: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0))),
  tokens: v.optional(tokensSchema),
  viaRelay: v.optional(v.boolean()),
});
export type AgentAttribution = v.InferOutput<typeof agentAttributionSchema>;

/** Result of the automated proposal audit. */
export const auditResultSchema = v.object({
  budgetDelta: v.number(),
  capacityDelta: v.number(),
  violations: v.array(v.pipe(v.string(), v.maxLength(1000))),
  counterStrategy: v.pipe(v.string(), v.maxLength(10_000)),
  draftCounterProposal: v.pipe(v.string(), v.maxLength(50_000)),
  actedBy: v.optional(activityActorSchema),
});
export type AuditResult = v.InferOutput<typeof auditResultSchema>;

export const FEEDBACK_KINDS = ["comment", "reject"] as const;
export const feedbackKindSchema = v.picklist(FEEDBACK_KINDS);
export type FeedbackKind = v.InferOutput<typeof feedbackKindSchema>;

/** Human feedback on a proposal, steering revision or closing the venue. */
export const proposalFeedbackSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  at: timestampSchema,
  by: roomRoleSchema,
  kind: feedbackKindSchema,
  text: v.pipe(v.string(), v.minLength(1), v.maxLength(10_000)),
});
export type ProposalFeedback = v.InferOutput<typeof proposalFeedbackSchema>;

/** An entry in the negotiation room activity feed. */
export const activityEventSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  at: timestampSchema,
  actor: activityActorSchema,
  message: v.pipe(v.string(), v.maxLength(5000)),
  attribution: v.optional(agentAttributionSchema),
  actedBy: v.optional(activityActorSchema),
});
export type ActivityEvent = v.InferOutput<typeof activityEventSchema>;

/** High-level event specs evaluated during negotiation. */
export const eventSpecsSchema = v.object({
  eventName: v.pipe(v.string(), v.maxLength(200)),
  targetDate: v.pipe(v.string(), v.maxLength(100)),
  guestCount: v.pipe(v.number(), v.integer(), v.minValue(0)),
  maxBudget: v.pipe(v.number(), v.minValue(0)),
  requiredCurfew: v.optional(v.pipe(v.string(), v.maxLength(20))),
  avRequired: v.optional(v.boolean()),
});
export type EventSpecs = v.InferOutput<typeof eventSpecsSchema>;

/**
 * Deal table row schema: one negotiation per entity row (decision D9).
 */
export const negotiationRowSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  entityId: v.pipe(v.string(), v.uuid()),
  projectId: v.pipe(v.string(), v.uuid()),
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
  status: negotiationStatusSchema,
  rawText: v.optional(v.pipe(v.string(), v.maxLength(100_000))),
  quotedCost: v.optional(v.pipe(v.number(), v.minValue(0))),
  quotedCapacity: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0))),
  quotedCurfew: v.optional(v.pipe(v.string(), v.maxLength(20))),
  avIncluded: v.optional(v.boolean()),
  audit: v.optional(auditResultSchema),
  approvedBy: v.optional(roomRoleSchema),
  actedBy: v.optional(activityActorSchema),
  feedback: v.optional(v.array(proposalFeedbackSchema)),
  revision: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0))),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});
export type NegotiationRow = v.InferOutput<typeof negotiationRowSchema>;

/** Aliased to negotiationSchema per contract specification. */
export const negotiationSchema = v.object(negotiationRowSchema.entries);
export type Negotiation = v.InferOutput<typeof negotiationSchema>;

/** Aliased to venueProposalSchema for compatibility with tarima2 terminology. */

export const createNegotiationSchema = v.omit(negotiationRowSchema, [
  "id",
  "createdAt",
  "updatedAt",
]);
export type CreateNegotiation = v.InferInput<typeof createNegotiationSchema>;

export const updateNegotiationSchema = v.partial(
  v.omit(negotiationRowSchema, ["id", "entityId", "projectId", "createdAt"]),
);
export type UpdateNegotiation = v.InferInput<typeof updateNegotiationSchema>;

/** Full room snapshot representing current state. */
export const roomSnapshotSchema = v.object({
  specs: v.optional(v.nullable(eventSpecsSchema)),
  negotiations: v.optional(v.array(negotiationRowSchema)),
  proposals: v.optional(v.array(negotiationRowSchema)),
  activity: v.optional(v.array(activityEventSchema)),
});
export type RoomSnapshot = v.InferOutput<typeof roomSnapshotSchema>;

export const roomStateSchema = v.object(roomSnapshotSchema.entries);
export type RoomState = v.InferOutput<typeof roomStateSchema>;

// Wire protocol: RoomIncoming messages
export const roomIncomingApproveSchema = v.object({
  type: v.literal("approve"),
  proposalId: v.pipe(v.string(), v.uuid()),
});
export type RoomIncomingApprove = v.InferOutput<typeof roomIncomingApproveSchema>;

export const roomIncomingRejectSchema = v.object({
  type: v.literal("reject"),
  proposalId: v.pipe(v.string(), v.uuid()),
  reason: v.optional(v.pipe(v.string(), v.maxLength(2000))),
});
export type RoomIncomingReject = v.InferOutput<typeof roomIncomingRejectSchema>;

export const roomIncomingCommentSchema = v.object({
  type: v.literal("comment"),
  proposalId: v.pipe(v.string(), v.uuid()),
  text: v.pipe(v.string(), v.minLength(1), v.maxLength(10_000)),
});
export type RoomIncomingComment = v.InferOutput<typeof roomIncomingCommentSchema>;

export const roomIncomingPingSchema = v.object({
  type: v.literal("ping"),
  timestamp: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0))),
});
export type RoomIncomingPing = v.InferOutput<typeof roomIncomingPingSchema>;

export const roomIncomingSchema = v.variant("type", [
  roomIncomingApproveSchema,
  roomIncomingRejectSchema,
  roomIncomingCommentSchema,
  roomIncomingPingSchema,
]);
export type RoomIncoming = v.InferOutput<typeof roomIncomingSchema>;

// Wire protocol: RoomOutgoing messages
export const roomOutgoingToastSchema = v.object({
  type: v.literal("toast"),
  message: v.pipe(v.string(), v.maxLength(1000)),
});
export type RoomOutgoingToast = v.InferOutput<typeof roomOutgoingToastSchema>;

export const roomOutgoingSnapshotSchema = v.object({
  type: v.literal("snapshot"),
  snapshot: v.optional(roomSnapshotSchema),
  state: v.optional(roomSnapshotSchema),
  specs: v.optional(v.nullable(eventSpecsSchema)),
  negotiations: v.optional(v.array(negotiationRowSchema)),
  proposals: v.optional(v.array(negotiationRowSchema)),
  activity: v.optional(v.array(activityEventSchema)),
});
export type RoomOutgoingSnapshot = v.InferOutput<typeof roomOutgoingSnapshotSchema>;

export const roomOutgoingPongSchema = v.object({
  type: v.literal("pong"),
  timestamp: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0))),
});
export type RoomOutgoingPong = v.InferOutput<typeof roomOutgoingPongSchema>;

export const roomOutgoingSchema = v.variant("type", [
  roomOutgoingToastSchema,
  roomOutgoingSnapshotSchema,
  roomOutgoingPongSchema,
]);
export type RoomOutgoing = v.InferOutput<typeof roomOutgoingSchema>;

export const roomSocketMetadataSchema = v.object({
  role: roomRoleSchema,
});
export type RoomSocketMetadata = v.InferOutput<typeof roomSocketMetadataSchema>;
