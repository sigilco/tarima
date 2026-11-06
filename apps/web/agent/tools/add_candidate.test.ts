/**
 * add_candidate: board-write tool. Runs against the temp sqlite db
 * vitest.config points DATABASE_URL at. Asserts ownership, the
 * createEntity wire shape (same as MCP), and name idempotency.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { db } from "@tarima/api/db";
import { entities, projects, users } from "@tarima/api/db/schema";
import addCandidate from "./add_candidate";

const OWNER = "u-ac-owner";
const OTHER = "u-ac-other";
const PROJECT = "p-ac-1";

const ctxFor = (userId: string | null) => ({
  session: { auth: { current: userId ? { principalId: userId } : null } },
});

const INPUT = {
  projectId: PROJECT,
  name: "Anthropic",
  contactEmail: "events@anthropic.example",
  website: "https://anthropic.example",
  kind: "ai-vendor",
  note: "Strong fit for the decision-models meetup",
};

beforeAll(() => {
  db.insert(users)
    .values({ id: OWNER, email: "ac-owner@tarima.test", role: "member" })
    .onConflictDoNothing()
    .run();
  db.insert(users)
    .values({ id: OTHER, email: "ac-other@tarima.test", role: "member" })
    .onConflictDoNothing()
    .run();
  db.insert(projects)
    .values({ id: PROJECT, ownerId: OWNER, name: "Berkeley meetup" })
    .onConflictDoNothing()
    .run();
});

describe("add_candidate", () => {
  it("rejects unauthenticated calls", async () => {
    const res = (await addCandidate.execute(INPUT, ctxFor(null) as never)) as {
      error?: string;
    };
    expect(res.error).toBe("unauthorized");
  });

  it("returns not_found for a project the caller does not own", async () => {
    const res = (await addCandidate.execute(INPUT, ctxFor(OTHER) as never)) as {
      error?: string;
    };
    expect(res.error).toBe("not_found");
  });

  it("creates a candidate row through createEntity (MCP-identical shape)", async () => {
    const res = (await addCandidate.execute(INPUT, ctxFor(OWNER) as never)) as {
      added: boolean;
      entity: {
        id: string;
        projectId: string;
        name: string;
        contact?: string;
        channel?: string;
        status: string;
        missing: string[];
      };
    };
    expect(res.added).toBe(true);
    expect(res.entity.projectId).toBe(PROJECT);
    expect(res.entity.name).toBe("Anthropic");
    expect(res.entity.contact).toBe("events@anthropic.example");
    expect(res.entity.channel).toBe("email");
    expect(res.entity.status).toBe("candidate");
    expect(res.entity.missing).toEqual([]);

    const row = db
      .select()
      .from(entities)
      .where(and(eq(entities.projectId, PROJECT), eq(entities.name, "Anthropic")))
      .get()!;
    expect(row.status).toBe("candidate");
    expect(row.contactEmail).toBe("events@anthropic.example");
    // goal extras are stored in the goal bag, not projected on the wire.
    const goal = row.goal as Record<string, unknown>;
    expect(goal.website).toBe("https://anthropic.example");
    expect(goal.kind).toBe("ai-vendor");
    expect(goal.source).toBe("agent");
    expect(goal.addedBy).toBe(OWNER);
  });

  it("is idempotent on project+name (case-insensitive)", async () => {
    const again = (await addCandidate.execute(
      { ...INPUT, name: "anthropic" },
      ctxFor(OWNER) as never,
    )) as { added: boolean; entityId?: string; note?: string };
    expect(again.added).toBe(false);
    expect(again.note).toContain("already exists");

    const rows = db
      .select({ id: entities.id })
      .from(entities)
      .where(and(eq(entities.projectId, PROJECT), eq(entities.name, "Anthropic")))
      .all();
    expect(rows).toHaveLength(1);
  });
});
