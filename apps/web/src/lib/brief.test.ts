import { describe, expect, it } from "vitest";
import { EMPTY_BRIEF_FORM, briefToForm, parseBriefForm } from "./brief";

const FULL = {
  ...EMPTY_BRIEF_FORM,
  eventType: "founder dinner",
  city: "Paris",
  date: "2026-11-14",
  headcount: "25",
  budgetAmount: "3500",
  notes: "private room, AV needed",
};

describe("parseBriefForm", () => {
  it("parses a filled form into a contract brief", () => {
    const brief = parseBriefForm(FULL);
    expect(brief).toBeTruthy();
    expect(brief?.eventType).toBe("founder dinner");
    expect(brief?.city).toBe("Paris");
    expect(brief?.date).toBe("2026-11-14");
    expect(brief?.headcount).toBe(25);
    expect(brief?.budgetAmount).toBe(3500);
    expect(brief?.currency).toBe("EUR");
    expect(brief?.notes).toBe("private room, AV needed");
  });

  it("drops the optional fields when they are empty", () => {
    const brief = parseBriefForm({
      ...FULL,
      date: "",
      notes: "",
    });
    expect(brief?.date).toBeUndefined();
    expect(brief?.notes).toBeUndefined();
  });

  it("upper cases the currency", () => {
    expect(parseBriefForm({ ...FULL, currency: "eur" })?.currency).toBe("EUR");
  });

  it("accepts a decimal budget written with a comma", () => {
    expect(parseBriefForm({ ...FULL, budgetAmount: "1200,50" })?.budgetAmount).toBe(1200.5);
  });

  it("rejects a form without the required fields", () => {
    expect(parseBriefForm(EMPTY_BRIEF_FORM)).toBeUndefined();
    expect(parseBriefForm({ ...FULL, eventType: "  " })).toBeUndefined();
    expect(parseBriefForm({ ...FULL, headcount: "0" })).toBeUndefined();
    expect(parseBriefForm({ ...FULL, headcount: "many" })).toBeUndefined();
    expect(parseBriefForm({ ...FULL, budgetAmount: "-1" })).toBeUndefined();
    expect(parseBriefForm({ ...FULL, currency: "EURO" })).toBeUndefined();
    expect(parseBriefForm({ ...FULL, date: "14/11/2026" })).toBeUndefined();
  });
});

describe("briefToForm", () => {
  it("round trips a brief back into the form values", () => {
    const brief = parseBriefForm(FULL);
    expect(briefToForm(brief!)).toEqual(FULL);
  });
});
