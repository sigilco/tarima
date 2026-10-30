/**
 * Stage and gate rules for the board (stream: integration, web side).
 *
 * The api owns the stage machine (contract `packages/contract/src/stage.ts`):
 * brief -> spec_review -> curating -> shortlist_review -> send_review ->
 * running -> done. This module turns that machine into the state the board
 * banner renders, and owns the shortlist selection rules, so both are
 * testable in plain node (see stage.test.ts).
 *
 * The pending gate is derived from the stage with the contract's
 * GATE_FOR_STAGE, so the banner works before the api starts sending
 * `pendingGate` on the payloads and keeps working if it stops.
 */
import { GATE_FOR_STAGE, type ApprovalGate, type ProjectStage } from "@tarima/contract";
import type { BoardRow } from "./board";

/** The stages a project can be in. Mirrors the contract's list. */
export const STAGES: ProjectStage[] = [
  "brief",
  "spec_review",
  "curating",
  "shortlist_review",
  "send_review",
  "running",
  "done",
];

/** The stage of a project, defaulting to `brief` when the api did not send one. */
export function projectStage(stage: string | undefined | null): ProjectStage {
  return (STAGES as string[]).includes(stage ?? "") ? (stage as ProjectStage) : "brief";
}

/**
 * The gate waiting on the user, if any.
 *
 * The api may send `pendingGate` explicitly; when it does not, the gate
 * is derived from the stage, which is the same rule the api applies.
 */
export function pendingGate(
  stage: string | undefined | null,
  explicit: string | undefined | null,
): ApprovalGate | undefined {
  if (explicit === "spec" || explicit === "shortlist" || explicit === "send") return explicit;
  return GATE_FOR_STAGE[projectStage(stage)];
}

/** The decision the board banner offers for a stage. */
export type GateAction = "none" | "submitBrief" | "curate" | "spec" | "shortlist" | "send";

export interface StageUiState {
  /** The stage, normalised. */
  stage: ProjectStage;
  /** The gate waiting on the user, if any. */
  gate: ApprovalGate | undefined;
  /** What the banner must offer. */
  action: GateAction;
  /** True when the banner shows a decision the user can take. */
  decidable: boolean;
}

/**
 * The banner state of a project.
 *
 * `hasBrief` decides whether the brief can be submitted for review: a
 * project without a brief has nothing to confirm.
 */
export function stageUiState(input: {
  stage: string | undefined | null;
  pendingGate?: string | null;
  hasBrief: boolean;
}): StageUiState {
  const stage = projectStage(input.stage);
  const gate = pendingGate(stage, input.pendingGate);

  if (gate === "spec") return { stage, gate, action: "spec", decidable: true };
  if (gate === "shortlist") return { stage, gate, action: "shortlist", decidable: true };
  if (gate === "send") return { stage, gate, action: "send", decidable: true };

  // No gate pending: the stage says what the user can do next.
  if (stage === "brief") {
    return { stage, gate, action: input.hasBrief ? "submitBrief" : "none", decidable: false };
  }
  if (stage === "curating") return { stage, gate, action: "curate", decidable: false };
  return { stage, gate, action: "none", decidable: false };
}

/** The rows that are candidates (curated venues waiting for the shortlist). */
export function candidateRows(rows: readonly BoardRow[]): BoardRow[] {
  return rows.filter((row) => row.status === "candidate");
}

/**
 * The candidate ids to send with the shortlist approval.
 *
 * Every candidate is kept by default, and the selection only ever holds
 * candidate ids: a row that is not a candidate cannot be shortlisted.
 */
export function shortlistSelection(
  candidates: readonly BoardRow[],
  checked: ReadonlySet<string>,
): string[] {
  const ids = new Set(candidates.map((row) => row.id));
  return [...ids].filter((id) => checked.has(id));
}

/**
 * The initial selection: every candidate checked.
 *
 * The selection is derived from the candidates, so a candidate that
 * appears later (a second curation pass) is checked by default too.
 */
export function defaultSelection(candidates: readonly BoardRow[]): Set<string> {
  return new Set(candidates.map((row) => row.id));
}

/** The first lines of a draft body, for the send gate preview. */
export function draftPreview(body: string, lines = 2): string {
  return body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, lines)
    .join(" ");
}
