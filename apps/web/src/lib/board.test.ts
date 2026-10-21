import { describe, expect, it } from "vitest";
import {
  bucketOf,
  countBuckets,
  filterRows,
  parseFilter,
  relativeTime,
  sortRows,
  type BoardRow,
} from "./board";

function row(overrides: Partial<BoardRow>): BoardRow {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    projectId: "10000000-0000-4000-8000-000000000001",
    name: "Acme",
    status: "intake",
    missing: [],
    createdAt: "2026-10-01T10:00:00.000Z",
    updatedAt: "2026-10-01T10:00:00.000Z",
    ...overrides,
  };
}

describe("bucketOf", () => {
  it("maps every pre-reply state to chasing", () => {
    for (const status of [
      "intake",
      "outreach",
      "awaiting_reply",
      "parsing",
      "notifying",
      "chasing",
    ]) {
      expect(bucketOf(status as BoardRow["status"])).toBe("chasing");
    }
  });

  it("gives replied, blocked and done their own buckets", () => {
    expect(bucketOf("replied")).toBe("replied");
    expect(bucketOf("blocked")).toBe("blocked");
    expect(bucketOf("done")).toBe("done");
  });
});

describe("parseFilter", () => {
  it("accepts a board bucket and rejects anything else", () => {
    expect(parseFilter("chasing")).toBe("chasing");
    expect(parseFilter("done")).toBe("done");
    expect(parseFilter("intake")).toBe("all");
    expect(parseFilter(undefined)).toBe("all");
    expect(parseFilter("DROP TABLE")).toBe("all");
  });
});

describe("filterRows", () => {
  const rows = [
    row({ id: "1", name: "A", status: "chasing" }),
    row({ id: "2", name: "B", status: "replied" }),
    row({ id: "3", name: "C", status: "done" }),
  ];

  it("returns everything for all", () => {
    expect(filterRows(rows, "all")).toHaveLength(3);
  });

  it("keeps only the bucket's rows", () => {
    expect(filterRows(rows, "replied").map((r) => r.id)).toEqual(["2"]);
  });

  it("does not mutate the input", () => {
    const before = rows.map((r) => r.id).join();
    filterRows(rows, "replied").pop();
    expect(rows.map((r) => r.id).join()).toBe(before);
  });
});

describe("sortRows", () => {
  it("orders blocked first, done last, oldest within a bucket", () => {
    const sorted = sortRows([
      row({ id: "z-done", name: "Done", status: "done", createdAt: "2026-10-01T10:00:00.000Z" }),
      row({
        id: "a-block",
        name: "Stuck",
        status: "blocked",
        createdAt: "2026-10-02T10:00:00.000Z",
      }),
      row({
        id: "b-chase-new",
        name: "New",
        status: "chasing",
        createdAt: "2026-10-03T10:00:00.000Z",
      }),
      row({
        id: "c-chase-old",
        name: "Old",
        status: "intake",
        createdAt: "2026-10-02T09:00:00.000Z",
      }),
    ]);

    expect(sorted.map((r) => r.id)).toEqual(["a-block", "c-chase-old", "b-chase-new", "z-done"]);
  });

  it("breaks same-bucket same-time ties on the id so the order is stable", () => {
    const sorted = sortRows([
      row({ id: "b", createdAt: "2026-10-01T10:00:00.000Z" }),
      row({ id: "a", createdAt: "2026-10-01T10:00:00.000Z" }),
    ]);
    expect(sorted.map((r) => r.id)).toEqual(["a", "b"]);
  });
});

describe("countBuckets", () => {
  it("always reports all four buckets in contract order", () => {
    const buckets = countBuckets([
      row({ id: "1", status: "chasing" }),
      row({ id: "2", status: "intake" }),
      row({ id: "3", status: "done" }),
    ]);
    expect(buckets).toEqual([
      { bucket: "chasing", count: 2 },
      { bucket: "replied", count: 0 },
      { bucket: "blocked", count: 0 },
      { bucket: "done", count: 1 },
    ]);
  });
});

describe("relativeTime", () => {
  const now = Date.parse("2026-10-21T12:00:00.000Z");

  it("formats seconds, minutes, hours and days", () => {
    expect(relativeTime("2026-10-21T11:59:40.000Z", now)).toBe("20s ago");
    expect(relativeTime("2026-10-21T11:45:00.000Z", now)).toBe("15m ago");
    expect(relativeTime("2026-10-21T10:00:00.000Z", now)).toBe("2h ago");
    expect(relativeTime("2026-10-19T12:00:00.000Z", now)).toBe("2d ago");
  });

  it("answers empty for an unparsable value", () => {
    expect(relativeTime("not-a-date", now)).toBe("");
  });
});
