import { describe, expect, it, vi } from "vitest";
import { createChannelRouter } from "../src/router";
import type { ChannelAdapter, OutboundMessage, SendResult } from "../src/types";

function fakeAdapter(id: ChannelAdapter["id"], result?: Partial<SendResult>): ChannelAdapter {
  return {
    id,
    send: vi.fn(async () => ({
      externalId: `${id}-1`,
      provider: id,
      accepted: true,
      ...result,
    })),
    verifyWebhook: vi.fn(() => true),
    parseInbound: vi.fn(async () => null),
  };
}

const msg = (channel: OutboundMessage["channel"]): OutboundMessage => ({
  channel,
  to: "someone@example.com",
  text: "hi",
});

describe("ChannelRouter", () => {
  it("dispatches to the adapter matching the channel tag", async () => {
    const email = fakeAdapter("email");
    const whatsapp = fakeAdapter("whatsapp");
    const router = createChannelRouter([email, whatsapp]);

    const res = await router.send(msg("email"));
    expect(res.provider).toBe("email");
    expect(email.send).toHaveBeenCalledTimes(1);
    expect(whatsapp.send).not.toHaveBeenCalled();

    await router.send(msg("whatsapp"));
    expect(whatsapp.send).toHaveBeenCalledTimes(1);
  });

  it("throws a clear error for an unknown channel", () => {
    const router = createChannelRouter([fakeAdapter("email")]);
    expect(() => router.get("telegram")).toThrowError(/unknown channel "telegram"/);
    expect(() => router.get("telegram")).toThrowError(/registered: email/);
  });

  it("throws when no adapter is registered at all", () => {
    const router = createChannelRouter();
    expect(() => router.get("inapp")).toThrowError(/registered: none/);
  });

  it("registers adapters after construction", async () => {
    const router = createChannelRouter();
    expect(router.has("email")).toBe(false);
    router.register(fakeAdapter("email"));
    expect(router.has("email")).toBe(true);
    expect(router.ids()).toEqual(["email"]);
    const res = await router.send(msg("email"));
    expect(res.accepted).toBe(true);
  });

  it("replaces an adapter when the same channel is registered twice", async () => {
    const first = fakeAdapter("email");
    const second = fakeAdapter("email");
    const router = createChannelRouter([first]);
    router.register(second);
    await router.send(msg("email"));
    expect(first.send).not.toHaveBeenCalled();
    expect(second.send).toHaveBeenCalledTimes(1);
  });
});
