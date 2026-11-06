import { describe, expect, it } from "vitest";
import { agentApprovalPolicy } from "./approval";

const decide = (toolName: string) =>
  agentApprovalPolicy({ toolName } as Parameters<typeof agentApprovalPolicy>[0]) as
    | string
    | undefined;

describe("agentApprovalPolicy", () => {
  it("never gates the read-only tools", () => {
    expect(decide("get_project_context")).toBe("not-applicable");
    expect(decide("list_venues")).toBe("not-applicable");
    expect(decide("list_sponsors")).toBe("not-applicable");
    expect(decide("search_venues")).toBe("not-applicable");
  });

  it("gates the outbound family", () => {
    for (const name of [
      "send_email",
      "send_whatsapp",
      "outbound_sms",
      "post_telegram",
      "email_venue",
      "whatsapp_send",
      "telegram_send",
    ]) {
      expect(decide(name)).toBe("user-approval");
    }
  });

  it("leaves internal writes and unknown tools ungated", () => {
    expect(decide("update_task")).toBe("not-applicable");
    expect(decide("some_future_tool")).toBe("not-applicable");
  });
});
