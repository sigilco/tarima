/**
 * set_brief: persist the structured event brief into
 * projects.goal.brief. Runs against the temp sqlite db vitest.config
 * points DATABASE_URL at. Asserts contract validation, goal merging,
 * and the ownership/auth gates.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@tarima/api/db";
import { projects, users } from "@tarima/api/db/schema";
import setBrief from "./set_brief";

const OWNER = "u-sb-owner";
const OTHER = "u-sb-other";
const PROJECT = "p-sb-1";

const ctxFor = (userId: string | null) => ({
  session: { auth: { current: userId ? { principalId: userId } : null } },
});

const INPUT = {
  projectId: PROJECT,
  eventType: "demo night",
  city: "Berkeley",
  headcount: 20,
  budgetAmount: 1200,
  currency: "USD",
};

beforeAll(() => {
  db.insert(users)
    .values([
      { id: OWNER, email: "sb-owner@tarima.test", role: "member" },
      { id: OTHER, email: "sb-other@tarima.test", role: "member" },
    ])
    .onConflictDoNothing()
    .run();
  db.insert(projects)
    .values({
      id: PROJECT,
      ownerId: OWNER,
      name: "Berkeley demo night",
      goal: { scratch: "keep me" },
    })
    .onConflictDoNothing()
    .run();
});

describe("set_brief", () => {
  it("rejects an unauthenticated caller", async () => {
    const out = (await setBrief.execute(INPUT, ctxFor(null) as never)) as { error?: string };
    expect(out.error).toBe("unauthorized");
  });

  it("rejects a project the caller does not own", async () => {
    const out = (await setBrief.execute(INPUT, ctxFor(OTHER) as never)) as { error?: string };
    expect(out.error).toBe("not_found");
  });

  it("writes goal.brief and preserves other goal keys", async () => {
    const out = (await setBrief.execute(
      { ...INPUT, date: "2026-11-20", venueRequirements: "projector + wifi" },
      ctxFor(OWNER) as never,
    )) as { project: { goal: Record<string, unknown> } };
    const goal = out.project.goal;
    expect(goal.scratch).toBe("keep me");
    const brief = goal.brief as Record<string, unknown>;
    expect(brief.eventType).toBe("demo night");
    expect(brief.city).toBe("Berkeley");
    expect(brief.headcount).toBe(20);
    expect(brief.currency).toBe("USD");
    expect(brief.date).toBe("2026-11-20");

    const row = db.select().from(projects).where(eq(projects.id, PROJECT)).get();
    expect((row?.goal as Record<string, unknown>).brief).toBeDefined();
  });

  it("rejects a brief that fails the contract schema", async () => {
    const out = (await setBrief.execute({ ...INPUT, currency: "usd" }, ctxFor(OWNER) as never)) as {
      error?: string;
    };
    expect(out.error).toBe("invalid_brief");
  });
});
