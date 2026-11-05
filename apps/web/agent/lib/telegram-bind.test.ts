/**
 * Telegram binding flow (SP6): chat id → tarima user through the
 * EXISTING `connect_codes` + `channel_bindings` tables. Runs against
 * the temp sqlite db vitest.config points DATABASE_URL at.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@tarima/api/db";
import { channelBindings, users } from "@tarima/api/db/schema";
import { createConnectCode } from "@tarima/api/services/connect-codes";
import { bindChatId, boundUserId, handleMessageText } from "./telegram-bind";

const CHAT_ID = "9001";

beforeAll(() => {
  db.insert(users)
    .values({ id: "u-tg-1", email: "tg@tarima.test", role: "member" })
    .onConflictDoNothing()
    .run();
  db.insert(users)
    .values({ id: "u-tg-2", email: "tg2@tarima.test", role: "member" })
    .onConflictDoNothing()
    .run();
});

let sent: string[] = [];
const send = async (message: string) => {
  sent.push(message);
};

describe("telegram binding flow", () => {
  it("refuses an unbound chat with a helpful message and no auth", async () => {
    sent = [];
    const result = await handleMessageText(CHAT_ID, "hello bot", send);
    expect(result).toBeNull();
    expect(sent[0]).toMatch(/isn't connected/);
  });

  it("binds via /start CODE and then authenticates the chat as that user", async () => {
    sent = [];
    const { code } = createConnectCode(db, "u-tg-1", "telegram");
    const bound = await handleMessageText(CHAT_ID, `/start ${code}`, send);
    expect(bound).toBeNull(); // binding answer, no turn
    expect(sent[0]).toMatch(/Connected/);

    const session = await handleMessageText(CHAT_ID, "ping", send);
    expect(session?.auth?.principalId).toBe("u-tg-1");
    expect(session?.auth?.principalType).toBe("user");
  });

  it("rejects invalid and single-use codes without binding", async () => {
    sent = [];
    const result = await handleMessageText("9002", "/start BOGUS1", send);
    expect(result).toBeNull();
    expect(sent[0]).toMatch(/invalid or expired/i);
    expect(boundUserId("9002")).toBeUndefined();

    // A fresh chat reusing the SAME code (already consumed above): invalid.
    const code = createConnectCode(db, "u-tg-2", "telegram");
    void handleMessageText("9003", code.code, send); // consume it
    sent = [];
    await handleMessageText("9004", code.code, send);
    expect(sent[0]).toMatch(/invalid or expired/i);
    expect(boundUserId("9004")).toBeUndefined();
  });

  it("rebinds a chat to a new user in place, one row per chat", async () => {
    bindChatId(CHAT_ID, "u-tg-2");
    const all = db
      .select()
      .from(channelBindings)
      .where(eq(channelBindings.externalId, CHAT_ID))
      .all();
    expect(all).toHaveLength(1);
    expect(all[0]?.userId).toBe("u-tg-2");
    expect(all[0]?.channel).toBe("telegram");
  });
});
