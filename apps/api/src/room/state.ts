/**
 * Negotiation Room in-memory state and pure transitions.
 *
 * Implements Phase 2 slice 3:
 * - In-memory state per project seeded from DB (deal_specs / goal, entities, events, deal tables).
 * - Applies SFM transitions from @tarima/room/sfm.
 * - Produces side effects for database persistence.
 */
import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import type {
  ActivityActor,
  ActivityEvent,
  AuditResult,
  EventSpecs,
  NegotiationRow,
  NegotiationStatus,
  ProposalFeedback,
  RoomIncoming,
  RoomOutgoing,
  RoomOutgoingSnapshot,
  RoomRole,
  RoomSnapshot,
} from "@tarima/contract";
import { transition } from "@tarima/room/sfm";
import {
  dealDecisions,
  dealSpecs,
  entities,
  events,
  projects,
  proposalVersions,
} from "../db/schema";
import type { ApiDb } from "../services/projects";

export interface ProjectRoomState {
  projectId: string;
  specs: EventSpecs | null;
  negotiations: NegotiationRow[];
  activity: ActivityEvent[];
}

export type RoomEffect =
  | {
      type: "db_insert_decision";
      negotiationId: string;
      decision: "approve" | "reject" | "comment" | "vendor_accept";
      by: string;
      text?: string;
    }
  | {
      type: "db_insert_proposal_version";
      negotiationId: string;
      revision: number;
      terms: Record<string, unknown>;
      audit: Record<string, unknown>;
      draftCounter: string;
    }
  | {
      type: "db_insert_event";
      actor: string;
      eventType: string;
      subjectType: string;
      subjectId: string;
      data: Record<string, unknown>;
    };

export interface TransitionResult {
  nextState: ProjectRoomState;
  effects: RoomEffect[];
  outgoing?: RoomOutgoing;
  broadcast: boolean;
}

/** Seed room state from the database for a given project. */
export function loadRoomStateFromDb(database: ApiDb, projectId: string): ProjectRoomState {
  // 1. Load project
  const project = database.select().from(projects).where(eq(projects.id, projectId)).get();

  // 2. Load latest deal specs
  const latestSpecRow = database
    .select()
    .from(dealSpecs)
    .where(eq(dealSpecs.projectId, projectId))
    .orderBy(desc(dealSpecs.version))
    .limit(1)
    .get();

  const rawSpec = (latestSpecRow?.spec as Record<string, unknown> | undefined) ?? {};
  const brief = (project?.goal?.brief as Record<string, unknown> | undefined) ?? {};

  const specs: EventSpecs = {
    eventName: String(rawSpec.eventName ?? brief.eventType ?? project?.name ?? "Event"),
    targetDate: String(rawSpec.targetDate ?? brief.date ?? "2026-12-01"),
    guestCount: Math.max(0, Number(rawSpec.guestCount ?? brief.headcount ?? 100)),
    maxBudget: Math.max(0, Number(rawSpec.maxBudget ?? brief.budgetAmount ?? 15000)),
    ...(rawSpec.requiredCurfew ? { requiredCurfew: String(rawSpec.requiredCurfew) } : {}),
    ...(typeof rawSpec.avRequired === "boolean" ? { avRequired: rawSpec.avRequired } : {}),
  };

  // 3. Load entities for project
  const entityRows = database
    .select()
    .from(entities)
    .where(eq(entities.projectId, projectId))
    .all();

  const negotiations: NegotiationRow[] = [];

  for (const entity of entityRows) {
    const nid = entity.id;

    // Load latest proposal version
    const latestVersion = database
      .select()
      .from(proposalVersions)
      .where(eq(proposalVersions.negotiationId, nid))
      .orderBy(desc(proposalVersions.revision))
      .limit(1)
      .get();

    // Load decisions for this negotiation
    const decisions = database
      .select()
      .from(dealDecisions)
      .where(eq(dealDecisions.negotiationId, nid))
      .orderBy(desc(dealDecisions.at))
      .all();

    const terms = (latestVersion?.terms as Record<string, unknown> | undefined) ?? {};
    const entityResult = (entity.result as Record<string, unknown> | undefined) ?? {};

    const quotedCost =
      typeof terms.quotedCost === "number"
        ? terms.quotedCost
        : typeof entityResult.quotedCost === "number"
          ? entityResult.quotedCost
          : typeof entityResult.cost === "number"
            ? entityResult.cost
            : typeof entityResult.price === "number"
              ? entityResult.price
              : Math.round(specs.maxBudget * 1.05);

    const quotedCapacity =
      typeof terms.quotedCapacity === "number"
        ? terms.quotedCapacity
        : typeof entityResult.quotedCapacity === "number"
          ? entityResult.quotedCapacity
          : typeof entityResult.capacity === "number"
            ? entityResult.capacity
            : specs.guestCount;

    const quotedCurfew =
      typeof terms.quotedCurfew === "string"
        ? terms.quotedCurfew
        : typeof entityResult.quotedCurfew === "string"
          ? entityResult.quotedCurfew
          : "23:30";

    const avIncluded =
      typeof terms.avIncluded === "boolean"
        ? terms.avIncluded
        : typeof entityResult.avIncluded === "boolean"
          ? entityResult.avIncluded
          : true;

    const rawText =
      typeof terms.rawText === "string"
        ? terms.rawText
        : typeof entityResult.rawText === "string"
          ? entityResult.rawText
          : `Proposal quote from ${entity.name}`;

    // Default audit result (deterministic placeholder attributed to system)
    const audit: AuditResult = (latestVersion?.audit as AuditResult | undefined) ?? {
      budgetDelta: quotedCost - specs.maxBudget,
      capacityDelta: quotedCapacity - specs.guestCount,
      violations: quotedCost > specs.maxBudget ? ["Quoted cost exceeds target budget"] : [],
      counterStrategy: "Request rate adjustment aligned with client budget ceiling.",
      draftCounterProposal: `We would like to propose a fee of EUR ${specs.maxBudget} inclusive of AV services.`,
      actedBy: "system",
    };

    // Build feedback history from decisions
    const feedback: ProposalFeedback[] = decisions
      .filter((d) => d.decision === "comment" || d.decision === "reject")
      .map((d) => ({
        id: d.id,
        at: d.at,
        by: (["organizer", "owner", "client", "agency", "observer"].includes(d.by)
          ? d.by
          : "organizer") as RoomRole,
        kind: (d.decision === "comment" ? "comment" : "reject") as "comment" | "reject",
        text: d.text ?? "",
      }));

    // Status resolution based on decisions and proposal state
    let status: NegotiationStatus = "requires_approval";
    if (decisions.length > 0) {
      const latestDec = decisions[0]!;
      if (latestDec.decision === "reject") {
        status = "rejected";
      } else if (latestDec.decision === "vendor_accept") {
        status = "accepted";
      } else if (latestDec.decision === "approve") {
        status = "counter_proposed";
      } else if (latestDec.decision === "comment") {
        status = "revising";
      }
    }

    const row: NegotiationRow = {
      id: nid,
      entityId: entity.id,
      projectId,
      name: entity.name,
      status,
      rawText,
      quotedCost,
      quotedCapacity,
      quotedCurfew,
      avIncluded,
      audit,
      approvedBy: decisions.find((d) => d.decision === "approve") ? "organizer" : undefined,
      actedBy: "negotiator",
      feedback,
      revision: latestVersion?.revision ?? 0,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };

    negotiations.push(row);
  }

  // 4. Load events for activity feed
  const eventRows = database
    .select()
    .from(events)
    .where(and(eq(events.subjectType, "negotiation")))
    .orderBy(desc(events.createdAt))
    .limit(50)
    .all();

  const activity: ActivityEvent[] = eventRows.map((e) => {
    const data = (e.data as Record<string, unknown> | undefined) ?? {};
    return {
      id: e.id,
      at: e.createdAt,
      actor: ([
        "scout",
        "finance",
        "negotiator",
        "client",
        "agency",
        "organizer",
        "owner",
        "system",
      ].includes(e.actor)
        ? e.actor
        : "system") as ActivityActor,
      message: typeof data.message === "string" ? data.message : `${e.actor} performed ${e.type}`,
      actedBy: "system",
    };
  });

  if (activity.length === 0) {
    activity.push({
      id: randomUUID(),
      at: Date.now(),
      actor: "system",
      message: "Negotiation room initialized",
      actedBy: "system",
    });
  }

  return {
    projectId,
    specs,
    negotiations,
    activity,
  };
}

/**
 * Pure reducer: processes an incoming action or SFM event against the in-memory room state.
 */
export function reduceRoomState(
  state: ProjectRoomState,
  action: RoomIncoming | { type: "counter_sent"; proposalId: string },
  actorRole: RoomRole,
): TransitionResult {
  // Ping handling: immediate pong without state modification
  if (action.type === "ping") {
    return {
      nextState: state,
      effects: [],
      outgoing: { type: "pong", timestamp: action.timestamp ?? Date.now() },
      broadcast: false,
    };
  }

  // Role check: observers are strictly read-only
  if (actorRole === "observer") {
    return {
      nextState: state,
      effects: [],
      outgoing: { type: "toast", message: "Observers are read-only" },
      broadcast: false,
    };
  }

  const proposalId = action.proposalId;
  const negotiationIndex = state.negotiations.findIndex((n) => n.id === proposalId);

  if (negotiationIndex === -1) {
    return {
      nextState: state,
      effects: [],
      outgoing: { type: "toast", message: "Negotiation not found" },
      broadcast: false,
    };
  }

  const currentNeg = state.negotiations[negotiationIndex]!;
  const now = Date.now();

  if (action.type === "approve") {
    const t = transition(currentNeg.status, "APPROVED", {
      now,
      revision: currentNeg.revision,
    });

    if (!t) {
      return {
        nextState: state,
        effects: [],
        outgoing: {
          type: "toast",
          message: `Cannot approve negotiation in '${currentNeg.status}' state`,
        },
        broadcast: false,
      };
    }

    const nextRevision = (currentNeg.revision ?? 0) + 1;
    const draftCounter =
      currentNeg.audit?.draftCounterProposal ??
      `Counter proposal: budget adjusted to ${state.specs?.maxBudget ?? 10000}`;

    const updatedNegotiation: NegotiationRow = {
      ...currentNeg,
      status: t.next,
      approvedBy: actorRole,
      revision: nextRevision,
      updatedAt: now,
    };

    const nextNegotiations = [...state.negotiations];
    nextNegotiations[negotiationIndex] = updatedNegotiation;

    const activityEvent: ActivityEvent = {
      id: randomUUID(),
      at: now,
      actor: (["organizer", "owner", "client", "agency"].includes(actorRole)
        ? actorRole
        : "organizer") as ActivityActor,
      message: `Approved counter proposal for ${currentNeg.name}`,
      actedBy: "system",
    };

    const effects: RoomEffect[] = [
      {
        type: "db_insert_proposal_version",
        negotiationId: currentNeg.id,
        revision: nextRevision,
        terms: {
          quotedCost: currentNeg.quotedCost,
          quotedCapacity: currentNeg.quotedCapacity,
          quotedCurfew: currentNeg.quotedCurfew,
          avIncluded: currentNeg.avIncluded,
        },
        audit: currentNeg.audit ?? {},
        draftCounter,
      },
      {
        type: "db_insert_decision",
        negotiationId: currentNeg.id,
        decision: "approve",
        by: actorRole,
        text: "Approved counter proposal",
      },
      {
        type: "db_insert_event",
        actor: actorRole,
        eventType: "deal.approved",
        subjectType: "negotiation",
        subjectId: currentNeg.id,
        data: {
          projectId: state.projectId,
          proposalId: currentNeg.id,
          message: `Approved counter proposal for ${currentNeg.name}`,
        },
      },
    ];

    return {
      nextState: {
        ...state,
        negotiations: nextNegotiations,
        activity: [activityEvent, ...state.activity],
      },
      effects,
      broadcast: true,
    };
  }

  if (action.type === "comment") {
    const t = transition(
      currentNeg.status,
      { type: "COMMENT_RECEIVED", text: action.text },
      { now },
    );

    if (!t) {
      return {
        nextState: state,
        effects: [],
        outgoing: {
          type: "toast",
          message: `Cannot comment on negotiation in '${currentNeg.status}' state`,
        },
        broadcast: false,
      };
    }

    const feedbackItem: ProposalFeedback = {
      id: randomUUID(),
      at: now,
      by: actorRole,
      kind: "comment",
      text: action.text,
    };

    const updatedNegotiation: NegotiationRow = {
      ...currentNeg,
      status: t.next,
      feedback: [...(currentNeg.feedback ?? []), feedbackItem],
      updatedAt: now,
    };

    const nextNegotiations = [...state.negotiations];
    nextNegotiations[negotiationIndex] = updatedNegotiation;

    const activityEvent: ActivityEvent = {
      id: randomUUID(),
      at: now,
      actor: (["organizer", "owner", "client", "agency"].includes(actorRole)
        ? actorRole
        : "organizer") as ActivityActor,
      message: `Feedback on ${currentNeg.name}: "${action.text}"`,
      actedBy: "system",
    };

    const effects: RoomEffect[] = [
      {
        type: "db_insert_decision",
        negotiationId: currentNeg.id,
        decision: "comment",
        by: actorRole,
        text: action.text,
      },
      {
        type: "db_insert_event",
        actor: actorRole,
        eventType: "deal.comment",
        subjectType: "negotiation",
        subjectId: currentNeg.id,
        data: {
          projectId: state.projectId,
          proposalId: currentNeg.id,
          message: `Feedback on ${currentNeg.name}: "${action.text}"`,
        },
      },
    ];

    return {
      nextState: {
        ...state,
        negotiations: nextNegotiations,
        activity: [activityEvent, ...state.activity],
      },
      effects,
      broadcast: true,
    };
  }

  if (action.type === "reject") {
    const t = transition(currentNeg.status, "REJECTED", { now });

    if (!t) {
      return {
        nextState: state,
        effects: [],
        outgoing: {
          type: "toast",
          message: `Cannot reject negotiation in '${currentNeg.status}' state`,
        },
        broadcast: false,
      };
    }

    const feedbackItems = [...(currentNeg.feedback ?? [])];
    if (action.reason) {
      feedbackItems.push({
        id: randomUUID(),
        at: now,
        by: actorRole,
        kind: "reject",
        text: action.reason,
      });
    }

    const updatedNegotiation: NegotiationRow = {
      ...currentNeg,
      status: t.next,
      feedback: feedbackItems,
      updatedAt: now,
    };

    const nextNegotiations = [...state.negotiations];
    nextNegotiations[negotiationIndex] = updatedNegotiation;

    const activityEvent: ActivityEvent = {
      id: randomUUID(),
      at: now,
      actor: (["organizer", "owner", "client", "agency"].includes(actorRole)
        ? actorRole
        : "organizer") as ActivityActor,
      message: `Declined proposal for ${currentNeg.name}${action.reason ? `: ${action.reason}` : ""}`,
      actedBy: "system",
    };

    const effects: RoomEffect[] = [
      {
        type: "db_insert_decision",
        negotiationId: currentNeg.id,
        decision: "reject",
        by: actorRole,
        text: action.reason ?? "Declined proposal",
      },
      {
        type: "db_insert_event",
        actor: actorRole,
        eventType: "deal.rejected",
        subjectType: "negotiation",
        subjectId: currentNeg.id,
        data: {
          projectId: state.projectId,
          proposalId: currentNeg.id,
          message: `Declined proposal for ${currentNeg.name}`,
        },
      },
    ];

    return {
      nextState: {
        ...state,
        negotiations: nextNegotiations,
        activity: [activityEvent, ...state.activity],
      },
      effects,
      broadcast: true,
    };
  }

  if (action.type === "counter_sent") {
    const t = transition(currentNeg.status, "COUNTER_SENT", { now });

    if (!t) {
      return {
        nextState: state,
        effects: [],
        outgoing: {
          type: "toast",
          message: `Cannot send counter proposal for negotiation in '${currentNeg.status}' state`,
        },
        broadcast: false,
      };
    }

    const updatedNegotiation: NegotiationRow = {
      ...currentNeg,
      status: t.next,
      updatedAt: now,
    };

    const nextNegotiations = [...state.negotiations];
    nextNegotiations[negotiationIndex] = updatedNegotiation;

    const activityEvent: ActivityEvent = {
      id: randomUUID(),
      at: now,
      actor: (["organizer", "owner", "client", "agency"].includes(actorRole)
        ? actorRole
        : "organizer") as ActivityActor,
      message: `Dispatched counter proposal to ${currentNeg.name}`,
      actedBy: "system",
    };

    const effects: RoomEffect[] = [
      {
        type: "db_insert_event",
        actor: actorRole,
        eventType: "deal.counter_sent",
        subjectType: "negotiation",
        subjectId: currentNeg.id,
        data: {
          projectId: state.projectId,
          proposalId: currentNeg.id,
          message: `Dispatched counter proposal to ${currentNeg.name}`,
        },
      },
    ];

    return {
      nextState: {
        ...state,
        negotiations: nextNegotiations,
        activity: [activityEvent, ...state.activity],
      },
      effects,
      broadcast: true,
    };
  }

  return {
    nextState: state,
    effects: [],
    outgoing: { type: "toast", message: "Unknown action" },
    broadcast: false,
  };
}

/** Execute side effects against the database. */
export function executeRoomEffects(database: ApiDb, effects: RoomEffect[]): void {
  const now = Date.now();
  for (const eff of effects) {
    if (eff.type === "db_insert_decision") {
      database
        .insert(dealDecisions)
        .values({
          id: randomUUID(),
          negotiationId: eff.negotiationId,
          decision: eff.decision,
          by: eff.by,
          text: eff.text ?? null,
          at: now,
          createdAt: now,
        })
        .run();
    } else if (eff.type === "db_insert_proposal_version") {
      database
        .insert(proposalVersions)
        .values({
          id: randomUUID(),
          negotiationId: eff.negotiationId,
          revision: eff.revision,
          terms: eff.terms,
          audit: eff.audit,
          draftCounter: eff.draftCounter,
          createdAt: now,
        })
        .run();
    } else if (eff.type === "db_insert_event") {
      database
        .insert(events)
        .values({
          id: randomUUID(),
          actor: eff.actor,
          type: eff.eventType,
          subjectType: eff.subjectType,
          subjectId: eff.subjectId,
          data: eff.data,
          createdAt: now,
        })
        .run();
    }
  }
}

/** Convert in-memory state to a compliant wire snapshot frame. */
export function createSnapshotMessage(state: ProjectRoomState): RoomOutgoingSnapshot {
  const snapshot: RoomSnapshot = {
    specs: state.specs,
    negotiations: state.negotiations,
    proposals: state.negotiations,
    activity: state.activity,
  };

  return {
    type: "snapshot",
    snapshot,
    state: snapshot,
    specs: state.specs,
    negotiations: state.negotiations,
    proposals: state.negotiations,
    activity: state.activity,
  };
}
