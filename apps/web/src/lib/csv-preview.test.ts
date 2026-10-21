import { describe, expect, it } from "vitest";
import { previewCsv } from "./csv-preview";

describe("previewCsv", () => {
  it("parses the happy path", () => {
    const result = previewCsv("name,contact,missing\nAcme,a@b.co,logo;deck\nBeta,,\n");
    expect(result.fatal).toBe(false);
    expect(result.rows).toEqual([
      { row: 2, name: "Acme", contact: "a@b.co", missing: ["logo", "deck"] },
      { row: 3, name: "Beta", contact: "", missing: [] },
    ]);
  });

  it("reports a missing name column as fatal", () => {
    const result = previewCsv("contact\na@b.co\n");
    expect(result.fatal).toBe(true);
    expect(result.message).toBe("missing-name-column");
  });

  it("reports an empty paste as fatal", () => {
    expect(previewCsv("   ").fatal).toBe(true);
  });

  it("marks a row without a name as an error and keeps the rest", () => {
    const result = previewCsv("name,contact\nGood,g@x.co\n,bad@x.co\n");
    expect(result.fatal).toBe(false);
    expect(result.rows[0]?.error).toBeUndefined();
    expect(result.rows[1]?.error).toBe("name-required");
  });

  it("marks a malformed contact as an error", () => {
    const result = previewCsv("name,contact\nAcme,not-an-email\n");
    expect(result.rows[0]?.error).toBe("contact-not-email");
  });

  it("keeps quoted cells together", () => {
    const result = previewCsv('name,contact\n"Acme, Inc.",a@b.co\n');
    expect(result.rows[0]?.name).toBe("Acme, Inc.");
  });

  it("skips blank lines silently", () => {
    const result = previewCsv("name\nA\n\n\nB\n");
    expect(result.rows.map((r) => r.name)).toEqual(["A", "B"]);
  });
});
