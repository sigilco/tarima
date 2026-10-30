/**
 * Project stages and the human approval gates (HITL). Stream C owns the
 * semantics; stream A consumes the shapes. Changes after the freeze must be
 * additive.
 *
 * Flow: brief -> spec_review -> curating -> shortlist_review -> send_review
 * -> running -> done. Nothing is sent to a third party before `send_review`
 * is approved.
 *
 * Routes (session surface; bearer routes mirror them):
 *   POST /api/ui/projects/:id/stage    advance the stage ({@link stageRequestSchema})
 *   POST /api/ui/projects/:id/approve  decide the pending gate ({@link approveRequestSchema})
 *   POST /api/ui/projects/:id/curate   run curation against the venue catalog
 */
import * as v from "valibot";
import { briefSchema } from "./brief.js";

export const PROJECT_STAGES = [
  "brief",
  "spec_review",
  "curating",
  "shortlist_review",
  "send_review",
  "running",
  "done",
] as const;
export const projectStageSchema = v.picklist(PROJECT_STAGES);
export type ProjectStage = v.InferOutput<typeof projectStageSchema>;

/** The gates a user can decide. */
export const APPROVAL_GATES = ["spec", "shortlist", "send"] as const;
export const approvalGateSchema = v.picklist(APPROVAL_GATES);
export type ApprovalGate = v.InferOutput<typeof approvalGateSchema>;

/** Which gate (if any) is waiting on the user for a given stage. */
export const GATE_FOR_STAGE: Partial<Record<ProjectStage, ApprovalGate>> = {
  spec_review: "spec",
  shortlist_review: "shortlist",
  send_review: "send",
};

/** Request: move a project forward. Only user-initiated transitions. */
export const stageRequestSchema = v.object({
  /** `spec_review` submits the brief for confirmation; `curating` starts curation. */
  to: v.picklist(["spec_review", "curating"]),
});
export type StageRequest = v.InferOutput<typeof stageRequestSchema>;

export const stageResponseSchema = v.object({
  projectId: v.pipe(v.string(), v.uuid()),
  stage: projectStageSchema,
  /** The gate now waiting on the user, if any. */
  pendingGate: v.optional(approvalGateSchema),
});
export type StageResponse = v.InferOutput<typeof stageResponseSchema>;

/** Request: decide the gate that is pending for this project. */
export const approveRequestSchema = v.object({
  gate: approvalGateSchema,
  decision: v.picklist(["approve", "reject"]),
  /** `spec` gate: edited brief replaces the stored one before intake. */
  brief: v.optional(briefSchema),
  /** `shortlist` gate: candidate entity ids to keep. Omitted means all. */
  entityIds: v.optional(v.array(v.pipe(v.string(), v.uuid()))),
});
export type ApproveRequest = v.InferOutput<typeof approveRequestSchema>;

export const approveResponseSchema = v.object({
  projectId: v.pipe(v.string(), v.uuid()),
  stage: projectStageSchema,
  pendingGate: v.optional(approvalGateSchema),
  /** Rows released by this decision (shortlist kept, drafts sent). */
  released: v.pipe(v.number(), v.integer(), v.minValue(0)),
  /** Rows dropped by a reject or by the shortlist cut. */
  discarded: v.pipe(v.number(), v.integer(), v.minValue(0)),
});
export type ApproveResponse = v.InferOutput<typeof approveResponseSchema>;

export const curateResponseSchema = v.object({
  projectId: v.pipe(v.string(), v.uuid()),
  /** Candidate rows created (`candidate` status) for the shortlist gate. */
  candidates: v.pipe(v.number(), v.integer(), v.minValue(0)),
  stage: projectStageSchema,
});
export type CurateResponse = v.InferOutput<typeof curateResponseSchema>;

/**
 * One staged outreach draft, as the send gate shows it. A draft exists
 * only in the journal until the gate approves; the drafts endpoint is
 * the read path for it.
 */
export const stagedDraftSchema = v.object({
  entityId: v.pipe(v.string(), v.uuid()),
  entityName: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
  /** The address the draft would go to; empty when the row has no contact. */
  to: v.pipe(v.string(), v.maxLength(320)),
  subject: v.pipe(v.string(), v.maxLength(500)),
  body: v.pipe(v.string(), v.maxLength(50_000)),
});
export type StagedDraft = v.InferOutput<typeof stagedDraftSchema>;

/** Response: GET /api/ui/projects/:id/drafts (the send gate's read path). */
export const draftsResponseSchema = v.object({
  projectId: v.pipe(v.string(), v.uuid()),
  stage: projectStageSchema,
  pendingGate: v.optional(approvalGateSchema),
  drafts: v.array(stagedDraftSchema),
});
export type DraftsResponse = v.InferOutput<typeof draftsResponseSchema>;
