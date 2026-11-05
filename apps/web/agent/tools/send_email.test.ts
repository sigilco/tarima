/**
 * send_email (SP8): the first gated outbound tool. Runs against the
 * temp sqlite db vitest.config points DATABASE_URL at. The gate itself
 * (`approval: always()`) is asserted by shape; the execute body is
 * asserted for ownership, staging, and idempotency.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@tarima/api/db";
import { outbox, projects, users } from "@tarima/api/db/schema";
import sendEmail from "./send_email";

const OWNER = "u-se-owner";
const OTHER = "u-se-other";
const PROJECT = "p-se-1";

const ctxFor = (userId: string | null) => ({
  session: { auth: { current: userId ? { principalId: userId } : null } },
});

const INPUT = {
  projectId: PROJECT,
  to: "sponsor@tarima.test",
  subject: "Catering quote for a Berkeley evening event",
  body: "Hi — could you quote catering for 20 people next week?",
};

beforeAll(() => {
  db.insert(users)
    .values({ id: OWNER, email: "se-owner@tarima.test", role: "member" })
    .onConflictDoNothing()
    .run();
  db.insert(users)
    .values({ id: OTHER, email: "se-other@tarima.test", role: "member" })
    .onConflictDoNothing()
    .run();
  db.insert(projects)
    .values({ id: PROJECT, ownerId: OWNER, name: "Berkeley evening" })
    .onConflictDoNothing()
    .run();
});

describe("send_email", () => {
  it("opts into a human gate with approval: always()", async () => {
    const approval = (sendEmail as { approval?: unknown }).approval;
    expect(typeof approval).toBe("function");
    const status = await (approval as (c: unknown) => unknown)({ toolName: "send_email" });
    expect(status).toBe("user-approval");
  });

  it("rejects an unauthenticated caller", async () => {
    const out = (await sendEmail.execute(INPUT, ctxFor(null) as never)) as { error?: string };
    expect(out.error).toBe("unauthorized");
  });

  it("rejects a project the caller does not own", async () => {
    const out = (await sendEmail.execute(INPUT, ctxFor(OTHER) as never)) as { error?: string };
    expect(out.error).toBe("not_found");
  });

  it("stages the email in the outbox with a derived idempotency key", async () => {
    const out = (await sendEmail.execute(INPUT, ctxFor(OWNER) as never)) as {
      staged: boolean;
      outboxId: string;
      status: string;
    };
    expect(out.staged).toBe(true);
    expect(out.status).toBe("staged");
    const rows = db.select().from(outbox).where(eq(outbox.id, out.outboxId)).all();
    expect(rows).toHaveLength(1);
    expect(rows[0].type).toBe("agent.email");
    expect(rows[0].status).toBe("staged");
    const payload = rows[0].payload as { to?: string; stagedBy?: string };
    expect(payload.to).toBe(INPUT.to);
    expect(payload.stagedBy).toBe(OWNER);
  });

  it("is idempotent: a retry with identical inputs does not double-stage", async () => {
    const before = db.select().from(outbox).all().length;
    const out = (await sendEmail.execute(INPUT, ctxFor(OWNER) as never)) as {
      staged: boolean;
      note?: string;
    };
    expect(out.staged).toBe(false);
    const after = db.select().from(outbox).all().length;
    expect(after).toBe(before);
  });
});
