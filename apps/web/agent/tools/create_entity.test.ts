/**
 * create_entity: candidate intake for the agent. Runs against the temp
 * sqlite db vitest.config points DATABASE_URL at. Asserts the row is
 * the same shape the REST/MCP `createEntity` path writes, plus the
 * ownership and auth gates.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@tarima/api/db";
import { entities, projects, users } from "@tarima/api/db/schema";
import createEntity from "./create_entity";

const OWNER = "u-ce-owner";
const OTHER = "u-ce-other";
const PROJECT = "p-ce-1";

const ctxFor = (userId: string | null) => ({
  session: { auth: { current: userId ? { principalId: userId } : null } },
});

const INPUT = {
  projectId: PROJECT,
  name: "Gravity Junction",
  contact: "events@gravity.test",
  channel: "email" as const,
};

beforeAll(() => {
  db.insert(users)
    .values([
      { id: OWNER, email: "ce-owner@tarima.test", role: "member" },
      { id: OTHER, email: "ce-other@tarima.test", role: "member" },
    ])
    .onConflictDoNothing()
    .run();
  db.insert(projects)
    .values({ id: PROJECT, ownerId: OWNER, name: "Berkeley evening" })
    .onConflictDoNothing()
    .run();
});

describe("create_entity", () => {
  it("rejects an unauthenticated caller", async () => {
    const out = (await createEntity.execute(INPUT, ctxFor(null) as never)) as { error?: string };
    expect(out.error).toBe("unauthorized");
  });

  it("rejects a project the caller does not own", async () => {
    const out = (await createEntity.execute(INPUT, ctxFor(OTHER) as never)) as {
      error?: string;
    };
    expect(out.error).toBe("not_found");
  });

  it("stages a candidate row identical to the service path", async () => {
    const out = (await createEntity.execute(INPUT, ctxFor(OWNER) as never)) as {
      entity: { id: string; status: string; contact?: string; channel?: string };
    };
    expect(out.entity.status).toBe("candidate");
    expect(out.entity.contact).toBe(INPUT.contact);
    expect(out.entity.channel).toBe("email");

    const rows = db.select().from(entities).where(eq(entities.id, out.entity.id)).all();
    expect(rows).toHaveLength(1);
    expect(rows[0].projectId).toBe(PROJECT);
    expect(rows[0].name).toBe(INPUT.name);
    expect(rows[0].contactEmail).toBe(INPUT.contact);
    // 'candidate' is a db status in its own right (status-map TO_DB);
    // channel lives inside the goal JSON bag (services/entities.ts).
    expect(rows[0].status).toBe("candidate");
    expect(rows[0].goal).toEqual({ missing: [], channel: "email" });
  });

  it("honours an explicit wire status and missing list", async () => {
    const out = (await createEntity.execute(
      { ...INPUT, name: "Blue Bottle", status: "outreach", missing: ["wifi details"] },
      ctxFor(OWNER) as never,
    )) as { entity: { id: string; status: string; missing: string[] } };
    expect(out.entity.status).toBe("chasing");
    expect(out.entity.missing).toEqual(["wifi details"]);
  });
});
