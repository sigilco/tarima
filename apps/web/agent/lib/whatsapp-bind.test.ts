/**
 * WhatsApp binding flow (W3): WhatsApp sender id → tarima user through
 * the EXISTING `connect_codes` + `channel_bindings` tables, mirroring
 * `telegram-bind.test.ts`. Runs against the temp sqlite db
 * vitest.config points DATABASE_URL at.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@tarima/api/db";
import { channelBindings, users } from "@tarima/api/db/schema";
import { createConnectCode } from "@tarima/api/services/connect-codes";
import { bindWhatsappUser, boundWhatsappUserId, handleMessageText } from "./whatsapp-bind";

const WA_ID = "15550001234";

beforeAll(() => {
  db.insert(users)
    .values({ id: "u-wa-1", email: "wa@tarima.test", role: "member" })
    .onConflictDoNothing()
    .run();
  db.insert(users)
    .values({ id: "u-wa-2", email: "wa2@tarima.test", role: "member" })
    .onConflictDoNothing()
    .run();
});

let sent: string[] = [];
const reply = async (message: string) => {
  sent.push(message);
};

const inbound = (text: string, externalId = WA_ID) =>
  handleMessageText({ channel: "whatsapp", externalId, text, reply });

describe("whatsapp binding flow", () => {
  it("answers a stranger with the connect notice and opens no turn", async () => {
    sent = [];
    const result = await inbound("hello bot", "15559990001");
    expect(result).toEqual({ kind: "reply" });
    expect(sent[0]).toMatch(/isn't connected/);
    expect(boundWhatsappUserId("15559990001")).toBeUndefined();
  });

  it("binds via /start CODE and then authenticates the sender as that user", async () => {
    sent = [];
    const { code } = createConnectCode(db, "u-wa-1", "whatsapp");
    const bound = await inbound(`/start ${code}`);
    expect(bound).toEqual({ kind: "reply" }); // binding answer, no turn
    expect(sent[0]).toMatch(/Connected/);

    const session = await inbound("ping");
    expect(session.kind).toBe("auth");
    if (session.kind === "auth") {
      expect(session.auth.principalId).toBe("u-wa-1");
      expect(session.auth.principalType).toBe("user");
      expect(session.auth.attributes.channel).toBe("whatsapp");
    }
  });

  it("rejects invalid and single-use codes without binding", async () => {
    sent = [];
    const result = await inbound("/start BOGUS1", "15559990002");
    expect(result).toEqual({ kind: "reply" });
    expect(sent[0]).toMatch(/invalid or expired/i);
    expect(boundWhatsappUserId("15559990002")).toBeUndefined();

    // A fresh number reusing the SAME code (already consumed above): invalid.
    const code = createConnectCode(db, "u-wa-2", "whatsapp");
    void inbound(code.code, "15559990003"); // consume it
    sent = [];
    await inbound(code.code, "15559990004");
    expect(sent[0]).toMatch(/invalid or expired/i);
    expect(boundWhatsappUserId("15559990004")).toBeUndefined();
  });

  it("rebinds a number to a new user in place, one row per number", async () => {
    bindWhatsappUser(WA_ID, "u-wa-2");
    const all = db
      .select()
      .from(channelBindings)
      .where(eq(channelBindings.externalId, WA_ID))
      .all();
    const whatsappRows = all.filter((row) => row.channel === "whatsapp");
    expect(whatsappRows).toHaveLength(1);
    expect(whatsappRows[0]?.userId).toBe("u-wa-2");
  });
});
