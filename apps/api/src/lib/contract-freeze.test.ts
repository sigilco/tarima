import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as v from "valibot";
import {
  approveRequestSchema,
  briefSchema,
  isAllowlisted,
  notifyPayloadSchema,
  parseAllowlist,
  projectGoalSchema,
} from "@tarima/contract";

const dir = mkdtempSync(join(tmpdir(), "tarima-freeze-"));
process.env.DATABASE_URL = join(dir, "test.db");
process.env.NODE_ENV = "test";

const brief = {
  eventType: "offsite",
  city: "Malaga",
  date: "2026-12-05",
  headcount: 40,
  budgetAmount: 5000,
  currency: "EUR",
  sponsors: { wanted: true, tiers: ["gold"] },
};

describe("beta contract freeze", () => {
  it("accepts a brief and keeps old goal rows valid", () => {
    expect(v.safeParse(briefSchema, brief).success).toBe(true);
    expect(v.safeParse(projectGoalSchema, {}).success).toBe(true);
    expect(v.safeParse(projectGoalSchema, { legacy: 1, brief }).success).toBe(true);
    expect(v.safeParse(briefSchema, { ...brief, currency: "eur" }).success).toBe(false);
  });

  it("validates gate and notify shapes", () => {
    expect(v.safeParse(approveRequestSchema, { gate: "send", decision: "approve" }).success).toBe(
      true,
    );
    expect(v.safeParse(approveRequestSchema, { gate: "x", decision: "approve" }).success).toBe(
      false,
    );
    expect(
      v.safeParse(notifyPayloadSchema, {
        projectId: "6f1b1c0e-3a52-4f3b-9d7e-1a2b3c4d5e6f",
        kind: "digest",
        summary: "2 replies in",
      }).success,
    ).toBe(true);
  });

  it("treats an empty allowlist as open and matches case-insensitively", () => {
    expect(parseAllowlist(" A@x.io, a@x.io ,b@x.io,")).toEqual(["a@x.io", "b@x.io"]);
    expect(isAllowlisted(undefined, "anyone@x.io")).toBe(true);
    expect(isAllowlisted("a@x.io", "A@X.io")).toBe(true);
    expect(isAllowlisted("a@x.io", "b@x.io")).toBe(false);
  });

  it("bootstraps the new tables and projects.stage", async () => {
    const { db } = await import("../db");
    const { channelBindings, connectCodes, projects, venueCatalog } = await import("../db/schema");
    expect(db.select().from(channelBindings).all()).toEqual([]);
    expect(db.select().from(connectCodes).all()).toEqual([]);
    expect(db.select().from(venueCatalog).all()).toEqual([]);
    expect(db.select().from(projects).all()).toEqual([]);
  });
});
