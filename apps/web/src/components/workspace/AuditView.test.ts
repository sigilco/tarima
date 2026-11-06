/**
 * AuditView: the audit tab renders seeded approvals + events. Node-env
 * renderToStaticMarkup keeps this a component test without a DOM.
 */
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AuditView, type AuditApproval, type AuditEvent } from "./AuditView";

const APPROVALS: AuditApproval[] = [
  {
    id: "ap-1",
    toolName: "send_email",
    status: "approved",
    projectId: "p-1",
    decidedBy: "u-owner",
    decidedAt: 1794000000000,
    createdAt: 1793999990000,
  },
];

const EVENTS: AuditEvent[] = [
  { sessionId: "sess-abc", type: "turn.settled", createdAt: 1794000001000 },
];

describe("AuditView", () => {
  it("renders approvals and activity with seeded data", () => {
    const html = renderToStaticMarkup(
      createElement(AuditView, {
        state: "ready",
        approvals: APPROVALS,
        events: EVENTS,
      }),
    );
    expect(html).toContain("send_email");
    expect(html).toContain("approved");
    expect(html).toContain("u-owner");
    expect(html).toContain("turn.settled");
    expect(html).toContain("sess-abc");
  });

  it("renders the empty state when nothing is recorded", () => {
    const html = renderToStaticMarkup(
      createElement(AuditView, { state: "ready", approvals: [], events: [] }),
    );
    expect(html).toContain("Nothing recorded yet");
  });

  it("renders the error state with a retry affordance", () => {
    const html = renderToStaticMarkup(
      createElement(AuditView, { state: "error", onRetry: () => {} }),
    );
    expect(html).toContain("Retry");
  });
});
