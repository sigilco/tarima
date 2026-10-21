import { describe, expect, it } from "vitest";
import { generateApiKey, splitApiKey, verifyApiKeyFormat } from "./keys.js";
import { createMemoryStore, verifyApiKey } from "./store.js";

describe("generateApiKey", () => {
  it("produces a well shaped key", () => {
    const { plaintext, record } = generateApiKey("u1", "test", ["projects:read"]);
    expect(plaintext.startsWith("tarima_")).toBe(true);
    expect(record.prefix).toMatch(/^[a-z0-9]{6}$/);
    expect(record.keyHash).not.toContain(record.prefix);
    expect(record.scopes).toEqual(["projects:read"]);
  });

  it("generates distinct keys", () => {
    const a = generateApiKey("u1", "a", []);
    const b = generateApiKey("u1", "b", []);
    expect(a.plaintext).not.toBe(b.plaintext);
    expect(a.record.prefix).not.toBe(b.record.prefix);
  });
});

describe("splitApiKey", () => {
  it("accepts the canonical shape", () => {
    expect(splitApiKey("tarima_abcdef_0123456789abcdef0123456789abcdef")).toEqual({
      prefix: "abcdef",
      secret: "0123456789abcdef0123456789abcdef",
    });
  });

  it("rejects malformed keys", () => {
    expect(splitApiKey("")).toBeNull();
    expect(splitApiKey("tarima_")).toBeNull();
    expect(splitApiKey("tarima_abc_0123456789abcdef0123456789abcdef")).toBeNull();
    expect(splitApiKey("other_abcdef_0123456789abcdef0123456789abcdef")).toBeNull();
    expect(splitApiKey("tarima_abcdef_short")).toBeNull();
  });

  it("verifyApiKeyFormat matches splitApiKey", () => {
    expect(verifyApiKeyFormat("tarima_abcdef_0123456789abcdef0123456789abcdef")).toBe(true);
    expect(verifyApiKeyFormat("nope")).toBe(false);
  });
});

describe("verifyApiKey", () => {
  it("round-trips a generated key", () => {
    const store = createMemoryStore();
    const { plaintext, record } = generateApiKey("u1", "test", ["projects:read"]);
    store.insert(record);
    expect(verifyApiKey(store, plaintext)).toEqual({
      userId: "u1",
      scopes: ["projects:read"],
    });
  });

  it("rejects a wrong secret", () => {
    const store = createMemoryStore();
    const { plaintext, record } = generateApiKey("u1", "test", []);
    store.insert(record);
    const wrong = plaintext.slice(0, -4) + "0000";
    expect(verifyApiKey(store, wrong)).toBeNull();
  });

  it("rejects an unknown prefix", () => {
    const store = createMemoryStore();
    expect(verifyApiKey(store, "tarima_ffffff_0123456789abcdef0123456789abcdef")).toBeNull();
  });

  it("rejects a revoked key", () => {
    const store = createMemoryStore();
    const { plaintext, record } = generateApiKey("u1", "test", []);
    store.insert(record);
    store.revoke(record.id, Date.now());
    expect(verifyApiKey(store, plaintext)).toBeNull();
  });

  it("rejects a malformed key without touching the store", () => {
    const store = createMemoryStore();
    expect(verifyApiKey(store, "garbage")).toBeNull();
  });
});
