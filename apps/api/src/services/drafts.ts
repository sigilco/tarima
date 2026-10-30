/**
 * Staged draft service: the read path behind the send gate.
 *
 * A chase run parks in `outreach_staged` with the draft held in the
 * input of its pending gate step (`chase.outreach_staged#n`, see
 * `@tarima/chase/handlers`). Nothing has been sent at that point; the
 * drafts endpoint is how the board lists what WOULD go out before the
 * user decides.
 *
 * Owner scoping: the caller passes the session user id; a project of
 * another owner reads as unknown, exactly like the other ui reads.
 */
import { and, eq } from "drizzle-orm";
import { listSteps } from "@tarima/engine/journal";
import { GATE_FOR_STAGE, type ProjectStage, type StagedDraft } from "@tarima/contract";
import { entities, workflows } from "../db/schema";
import type { ApiDb } from "./projects";
import { getProject, type ProjectWire } from "./projects";

/** Drafts of a project: the staged list plus the project's gate state. */
export interface DraftsView {
  project: ProjectWire;
  /** The gate waiting on the user, if any (contract GATE_FOR_STAGE). */
  pendingGate?: string;
  drafts: StagedDraft[];
}

/**
 * The draft a parked run holds.
 *
 * The park step re-enqueues itself with the draft in its input, so the
 * newest pending gate step carries the current draft.
 */
function stagedDraft(db: ApiDb, run: typeof workflows.$inferSelect): StagedDraft | undefined {
  const context = (run.context ?? {}) as Record<string, unknown>;
  const entityId = typeof context.entityId === "string" ? context.entityId : undefined;
  const entityName = typeof context.entityName === "string" ? context.entityName : undefined;
  if (!entityId || !entityName) return undefined;

  const pending = listSteps(db, run.id).filter(
    (step) => step.stepKey.startsWith("chase.outreach_staged") && step.status === "pending",
  );
  const input = pending.at(-1)?.input as { draft?: unknown } | undefined;
  const draft = input?.draft as { subject?: unknown; body?: unknown } | undefined;
  if (!draft || typeof draft.subject !== "string" || typeof draft.body !== "string") {
    return undefined;
  }
  return {
    entityId,
    entityName,
    to: typeof context.contactEmail === "string" ? context.contactEmail : "",
    subject: draft.subject,
    body: draft.body,
  };
}

/**
 * The staged drafts of a project, or undefined when the project is
 * unknown (or owned by somebody else).
 */
export function listDrafts(
  db: ApiDb,
  projectId: string,
  ownerId?: string | null,
): DraftsView | undefined {
  const project = getProject(db, projectId, ownerId);
  if (!project) return undefined;

  // Runs join to the project through the entity id their context carries.
  const entityIds = new Set(
    db
      .select({ id: entities.id })
      .from(entities)
      .where(eq(entities.projectId, projectId))
      .all()
      .map((row) => row.id),
  );

  const drafts = db
    .select()
    .from(workflows)
    .where(and(eq(workflows.type, "chase-deliverables"), eq(workflows.status, "running")))
    .all()
    .filter((run) => {
      const entityId = (run.context as Record<string, unknown> | undefined)?.entityId;
      return (
        run.state === "outreach_staged" && typeof entityId === "string" && entityIds.has(entityId)
      );
    })
    .map((run) => stagedDraft(db, run))
    .filter((draft): draft is StagedDraft => draft !== undefined);

  return {
    project,
    pendingGate: GATE_FOR_STAGE[project.stage as ProjectStage],
    drafts,
  };
}
