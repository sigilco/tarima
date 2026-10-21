import { describe, expect, it } from "vitest";
import { CHASE_ROW_STATES } from "@tarima/contract";
import { dbStatuses, toDbStatus, toWireStatus, wireStatuses } from "./status-map";
import { entityStatuses } from "../db/schema";

describe("status map", () => {
  it("covers every wire state", () => {
    expect(wireStatuses()).toEqual([...CHASE_ROW_STATES]);
  });

  it("covers every db status", () => {
    expect(dbStatuses()).toEqual([...entityStatuses]);
  });

  it("translates every wire state to a db status", () => {
    for (const state of CHASE_ROW_STATES) {
      expect(entityStatuses).toContain(toDbStatus(state));
    }
  });

  it("translates every db status to a wire state", () => {
    for (const status of entityStatuses) {
      expect(CHASE_ROW_STATES).toContain(toWireStatus(status));
    }
  });

  it("round-trips the states that have a single db counterpart", () => {
    // The wire states whose db counterpart is not shared with another
    // wire state must survive a round trip unchanged.
    const stable = [
      "intake",
      "awaiting_reply",
      "validating",
      "updating",
      "notifying",
      "chasing",
      "blocked",
      "done",
    ] as const;
    for (const state of stable) {
      expect(toWireStatus(toDbStatus(state))).toBe(state);
    }
  });

  it("maps the collapsed states deterministically", () => {
    // outreach and chasing share the db state "chasing"; the inverse
    // picks one of them, always the same one.
    expect(toDbStatus("outreach")).toBe("chasing");
    expect(toWireStatus("chasing")).toBe("chasing");

    // parsing and replied share "parsed"; the inverse picks "replied".
    expect(toDbStatus("parsing")).toBe("parsed");
    expect(toWireStatus("parsed")).toBe("replied");

    // The db-only "pending" state surfaces as "intake".
    expect(toWireStatus("pending")).toBe("intake");
  });

  it("degrades an unknown db status to intake", () => {
    expect(toWireStatus("something-new")).toBe("intake");
  });
});
