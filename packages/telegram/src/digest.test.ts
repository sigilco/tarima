import { describe, expect, it } from "vitest";
import { DIGEST_MAX_ROWS, digestForProject } from "./digest.js";
import type { DigestInput } from "./types.js";

function input(overrides: Partial<DigestInput> = {}): DigestInput {
  return {
    projectId: "p1",
    projectName: "Beta Launch",
    rows: [],
    totals: { done: 0, chasing: 0, awaiting: 0, blocked: 0, total: 0 },
    ...overrides,
  };
}

describe("digestForProject", () => {
  it("renders the project name and the counts line", () => {
    const text = digestForProject(
      input({ totals: { done: 3, chasing: 2, awaiting: 1, blocked: 0, total: 6 } }),
    );
    expect(text).toContain("Project: Beta Launch");
    expect(text).toContain("done: 3 | chasing: 2 | awaiting: 1 | blocked: 0 | total: 6");
  });

  it("renders a row with its status and missing list", () => {
    const text = digestForProject(
      input({
        rows: [{ name: "Acme", status: "chasing", missing: ["logo", "deck"] }],
        totals: { done: 0, chasing: 1, awaiting: 0, blocked: 0, total: 1 },
      }),
    );
    expect(text).toContain("- Acme [chasing] missing: logo, deck");
  });

  it("omits the missing tail when the row has none", () => {
    const text = digestForProject(
      input({
        rows: [{ name: "Acme", status: "done" }],
        totals: { done: 1, chasing: 0, awaiting: 0, blocked: 0, total: 1 },
      }),
    );
    expect(text).toContain("- Acme [done]");
    expect(text).not.toContain("missing");
  });

  it("orders rows by severity then name, regardless of input order", () => {
    const rows = [
      { name: "Zeta", status: "done" },
      { name: "Alpha", status: "chasing" },
      { name: "Mid", status: "blocked" },
      { name: "Beta", status: "chasing" },
      { name: "New", status: "intake" },
    ];
    const first = digestForProject(input({ rows }));
    const second = digestForProject(input({ rows: rows.toReversed() }));
    expect(first).toBe(second);
    expect(first.indexOf("- Mid [blocked]")).toBeLessThan(first.indexOf("- Alpha [chasing]"));
    expect(first.indexOf("- Alpha [chasing]")).toBeLessThan(first.indexOf("- Beta [chasing]"));
    expect(first.indexOf("- Beta [chasing]")).toBeLessThan(first.indexOf("- New [intake]"));
  });

  it("truncates at ten rows and reports how many were dropped", () => {
    const rows = Array.from({ length: DIGEST_MAX_ROWS + 4 }, (_, i) => ({
      name: `Row ${i}`,
      status: "chasing",
    }));
    const text = digestForProject(input({ rows }));
    expect(text).toContain(`... 4 more row(s)`);
    const rendered = text.split("\n").filter((line) => line.startsWith("- "));
    expect(rendered).toHaveLength(DIGEST_MAX_ROWS);
  });

  it("collapses whitespace and newlines inside names and items", () => {
    const text = digestForProject(
      input({
        rows: [{ name: "Multi\nLine  Name", status: "chasing", missing: ["two  words\nhere"] }],
      }),
    );
    const line = text.split("\n").find((l) => l.startsWith("- ")) ?? "";
    expect(line).toBe("- Multi Line Name [chasing] missing: two words here");
  });

  it("uses a template free of em dashes", () => {
    // User supplied names are echoed verbatim, but the template around
    // them is ours and must stay dash-free.
    const text = digestForProject(
      input({
        rows: [{ name: "Acme", status: "chasing", missing: ["logo"] }],
      }),
    );
    expect(text).not.toContain("—");
  });

  it("is deterministic for the same input", () => {
    const source = input({
      rows: [
        { name: "A", status: "awaiting_reply" },
        { name: "B", status: "blocked", missing: ["z", "a"] },
      ],
      totals: { done: 0, chasing: 1, awaiting: 1, blocked: 1, total: 2 },
    });
    expect(digestForProject(source)).toBe(digestForProject(source));
  });
});
