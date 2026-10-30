import { describe, expect, it } from "vitest";
import {
  candidateRows,
  defaultSelection,
  draftPreview,
  pendingGate,
  projectStage,
  shortlistSelection,
  stageUiState,
} from "./stage";
import type { BoardRow } from "./board";

function row(overrides: Partial<BoardRow>): BoardRow {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    projectId: "10000000-0000-4000-8000-000000000001",
    name: "Acme",
    status: "candidate",
    missing: [],
    createdAt: "2026-10-01T10:00:00.000Z",
    updatedAt: "2026-10-01T10:00:00.000Z",
    ...overrides,
  };
}

describe("projectStage", () => {
  it("keeps a known stage", () => {
    expect(projectStage("spec_review")).toBe("spec_review");
    expect(projectStage("shortlist_review")).toBe("shortlist_review");
  });

  it("falls back to brief for an unknown or missing stage", () => {
    expect(projectStage(undefined)).toBe("brief");
    expect(projectStage(null)).toBe("brief");
    expect(projectStage("nonsense")).toBe("brief");
  });
});

describe("pendingGate", () => {
  it("uses the explicit gate when the api sends one", () => {
    expect(pendingGate("brief", "send")).toBe("send");
  });

  it("derives the gate from the stage when the api does not send one", () => {
    expect(pendingGate("spec_review", undefined)).toBe("spec");
    expect(pendingGate("shortlist_review", null)).toBe("shortlist");
    expect(pendingGate("send_review", undefined)).toBe("send");
    expect(pendingGate("brief", undefined)).toBeUndefined();
    expect(pendingGate("running", undefined)).toBeUndefined();
  });

  it("ignores an unknown explicit gate", () => {
    expect(pendingGate("spec_review", "bogus")).toBe("spec");
  });
});

describe("stageUiState", () => {
  it("offers the brief submission while the project is a brief", () => {
    const state = stageUiState({ stage: "brief", hasBrief: true });
    expect(state.action).toBe("submitBrief");
    expect(state.decidable).toBe(false);
  });

  it("offers nothing to submit without a brief", () => {
    const state = stageUiState({ stage: "brief", hasBrief: false });
    expect(state.action).toBe("none");
  });

  it("offers the spec gate at spec_review", () => {
    const state = stageUiState({ stage: "spec_review", hasBrief: true });
    expect(state.action).toBe("spec");
    expect(state.gate).toBe("spec");
    expect(state.decidable).toBe(true);
  });

  it("offers the venue search while curating", () => {
    const state = stageUiState({ stage: "curating", hasBrief: true });
    expect(state.action).toBe("curate");
    expect(state.decidable).toBe(false);
  });

  it("offers the shortlist gate at shortlist_review", () => {
    const state = stageUiState({ stage: "shortlist_review", hasBrief: true });
    expect(state.action).toBe("shortlist");
    expect(state.gate).toBe("shortlist");
  });

  it("offers the send gate at send_review", () => {
    const state = stageUiState({ stage: "send_review", hasBrief: true });
    expect(state.action).toBe("send");
    expect(state.gate).toBe("send");
  });

  it("offers nothing once the project runs", () => {
    const state = stageUiState({ stage: "running", hasBrief: true });
    expect(state.action).toBe("none");
    expect(state.decidable).toBe(false);
  });
});

describe("candidateRows", () => {
  it("keeps only the candidate rows", () => {
    const rows = [
      row({ id: "1", status: "candidate" }),
      row({ id: "2", status: "intake" }),
      row({ id: "3", status: "chasing" }),
    ];
    expect(candidateRows(rows).map((r) => r.id)).toEqual(["1"]);
  });
});

describe("shortlistSelection", () => {
  const candidates = [
    row({ id: "1", name: "A" }),
    row({ id: "2", name: "B" }),
    row({ id: "3", name: "C" }),
  ];

  it("sends every checked candidate", () => {
    expect(shortlistSelection(candidates, new Set(["1", "3"]))).toEqual(["1", "3"]);
  });

  it("never sends a row that is not a candidate", () => {
    expect(shortlistSelection(candidates, new Set(["1", "not-a-candidate"]))).toEqual(["1"]);
  });

  it("sends nothing when nothing is checked", () => {
    expect(shortlistSelection(candidates, new Set())).toEqual([]);
  });
});

describe("defaultSelection", () => {
  it("checks every candidate", () => {
    const rows = [row({ id: "1" }), row({ id: "2" })];
    expect([...defaultSelection(rows)]).toEqual(["1", "2"]);
  });
});

describe("draftPreview", () => {
  it("joins the first non-empty lines of the body", () => {
    expect(draftPreview("\n  Hello there  \n\nSecond line\nThird line")).toBe(
      "Hello there Second line",
    );
  });

  it("answers empty for an empty body", () => {
    expect(draftPreview("   \n  ")).toBe("");
  });
});
