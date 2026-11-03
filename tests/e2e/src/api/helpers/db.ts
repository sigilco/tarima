/**
 * Direct database assertions for the e2e suites.
 *
 * The status-map gotcha: the wire vocabulary and the db vocabulary are
 * different sets of words. The db column `entities.status` holds the
 * engine vocabulary (pending, intake, chasing, await_reply, parsed,
 * validated, updated, notified, done, failed) while the api translates
 * it to the wire vocabulary on the way out. A test that asserts on the
 * wire shape breaks the moment the translation changes, so these helpers
 * read the db rows directly and assert on the db vocabulary, plus on the
 * `entities.result` bag, which has no wire counterpart at all.
 *
 * The file is read with `node:sqlite`, which is built into the pinned
 * node runtime, so the suite needs no extra dependency.
 */
import { DatabaseSync } from "node:sqlite";

/** One entity row, as the db stores it. */
export interface DbEntity {
  id: string;
  project_id: string;
  name: string;
  contact_email: string | null;
  goal: string;
  result: string;
  status: string;
  created_at: number;
  updated_at: number;
}

/** One outreach message row, as the db stores it. */
export interface DbOutreachMessage {
  id: string;
  entity_id: string;
  direction: string;
  subject: string | null;
  body: string;
  received_at: number | null;
  sent_at: number | null;
}

/** One workflow run row, as the db stores it. */
export interface DbWorkflow {
  id: string;
  type: string;
  status: string;
  state: string;
  context: string;
}

/** A read-only view on the api database. */
export class DbReader {
  private readonly db: DatabaseSync;

  constructor(path: string) {
    this.db = new DatabaseSync(path, { readOnly: true });
  }

  /** Close the handle. */
  close(): void {
    this.db.close();
  }

  /** Every entity of a project. */
  entities(projectId: string): DbEntity[] {
    return this.db
      .prepare("SELECT * FROM entities WHERE project_id = ? ORDER BY created_at ASC, id ASC")
      .all(projectId) as unknown as DbEntity[];
  }

  /** One entity by id. */
  entity(entityId: string): DbEntity | undefined {
    return this.db.prepare("SELECT * FROM entities WHERE id = ?").get(entityId) as unknown as
      | DbEntity
      | undefined;
  }

  /** Every outreach message of an entity. */
  messages(entityId: string): DbOutreachMessage[] {
    return this.db
      .prepare("SELECT * FROM outreach_messages WHERE entity_id = ? ORDER BY created_at ASC")
      .all(entityId) as unknown as DbOutreachMessage[];
  }

  /**
   * Every chase run of a project, oldest first.
   *
   * The run context carries the entity id, not the project id, so the
   * runs are found through the entities of the project.
   */
  runs(projectId: string): DbWorkflow[] {
    return this.db
      .prepare(
        `SELECT * FROM workflows
         WHERE type = 'chase-deliverables'
           AND json_extract(context, '$.entityId') IN (
             SELECT id FROM entities WHERE project_id = ?
           )
         ORDER BY created_at ASC`,
      )
      .all(projectId) as unknown as DbWorkflow[];
  }

  /** Every workflow run of the database. */
  allRuns(): DbWorkflow[] {
    return this.db
      .prepare("SELECT * FROM workflows ORDER BY created_at ASC")
      .all() as unknown as DbWorkflow[];
  }

  /** The parsed `result` bag of an entity. */
  result(entityId: string): Record<string, unknown> {
    const row = this.entity(entityId);
    if (!row) return {};
    return JSON.parse(row.result) as Record<string, unknown>;
  }

  /** The parsed `goal` bag of an entity. */
  goal(entityId: string): Record<string, unknown> {
    const row = this.entity(entityId);
    if (!row) return {};
    return JSON.parse(row.goal) as Record<string, unknown>;
  }
}
