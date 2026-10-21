import { describe, expect, it } from "vitest";
import { CSV_MAX_ROWS, parseEntitiesCsv } from "./csv-intake";

describe("parseEntitiesCsv", () => {
  it("parses the happy path", () => {
    const result = parseEntitiesCsv("name,contact,missing\nAcme,a@b.co,logo;deck\nBeta,,\n");
    expect(result.errors).toEqual([]);
    expect(result.entities).toEqual([
      { name: "Acme", contact: "a@b.co", missing: ["logo", "deck"] },
      { name: "Beta", missing: [] },
    ]);
  });

  it("splits the missing list on semicolons and drops empties", () => {
    const result = parseEntitiesCsv("name,missing\nA,one;;two ; three\n");
    expect(result.entities[0]?.missing).toEqual(["one", "two", "three"]);
  });

  it("tolerates column reordering and extra whitespace", () => {
    const result = parseEntitiesCsv("missing,name\nlogo;deck,  Acme \n");
    expect(result.entities[0]).toEqual({ name: "Acme", missing: ["logo", "deck"] });
  });

  it("skips blank rows silently", () => {
    const result = parseEntitiesCsv("name\nA\n\n\nB\n");
    expect(result.entities).toHaveLength(2);
    expect(result.errors).toEqual([]);
  });

  it("collects a per-row error for a missing name and keeps the rest", () => {
    const result = parseEntitiesCsv("name,contact\nA,a@b.co\n,b@c.co\nC,\n");
    expect(result.entities.map((e) => e.name)).toEqual(["A", "C"]);
    expect(result.errors).toEqual([{ row: 3, message: "name is required" }]);
  });

  it("collects a per-row error for a malformed contact", () => {
    const result = parseEntitiesCsv("name,contact\nA,not-an-email\nB,b@c.co\n");
    expect(result.entities.map((e) => e.name)).toEqual(["B"]);
    expect(result.errors[0]?.row).toBe(2);
    expect(result.errors[0]?.message).toContain("not-an-email");
  });

  it("truncates and reports rows past the 500 row cap", () => {
    const rows = Array.from({ length: CSV_MAX_ROWS + 10 }, (_, i) => `Entity ${i}`).join("\n");
    const result = parseEntitiesCsv(`name\n${rows}\n`);
    expect(result.entities).toHaveLength(CSV_MAX_ROWS);
    expect(result.entities[0]).toEqual({ name: "Entity 0", missing: [] });
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.message).toContain("10 row(s) dropped");
  });

  it("reports a fatal error for empty input", () => {
    const result = parseEntitiesCsv("   \n");
    expect(result.entities).toEqual([]);
    expect(result.errors[0]?.message).toBe("csv is empty");
  });

  it("reports a fatal error when the name column is absent", () => {
    const result = parseEntitiesCsv("contact,missing\na@b.co,logo\n");
    expect(result.entities).toEqual([]);
    expect(result.errors[0]?.row).toBe(1);
    expect(result.errors[0]?.message).toContain('"name"');
  });

  it("strips a leading BOM from the header", () => {
    const bom = "\uFEFFname,contact\nAcme,a@b.co\n";
    const result = parseEntitiesCsv(bom);
    expect(result.entities[0]?.name).toBe("Acme");
    expect(result.errors).toEqual([]);
  });

  it("accepts a quoted csv with commas inside cells", () => {
    const result = parseEntitiesCsv('name,missing\n"Acme, Inc","logo, big;deck"\n');
    expect(result.entities[0]).toEqual({ name: "Acme, Inc", missing: ["logo, big", "deck"] });
  });
});
