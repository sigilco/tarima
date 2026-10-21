import { describe, expect, it } from "vitest";
import {
  createTelegramBot,
  createTelegramHandle,
  handleCommand,
  parseCommand,
  usageText,
} from "./bot.js";
import { MemoryBindingStore } from "./store.js";
import type { DigestInput } from "./types.js";

const PROJECT: DigestInput = {
  projectId: "p1",
  projectName: "Beta Launch",
  rows: [{ name: "Acme", status: "chasing", missing: ["logo"] }],
  totals: { done: 0, chasing: 1, awaiting: 0, blocked: 0, total: 1 },
};

function deps(store = new MemoryBindingStore()) {
  return {
    store,
    source: {
      async digest(projectId: string): Promise<DigestInput | null> {
        return projectId === "p1" ? PROJECT : null;
      },
    },
  };
}

describe("parseCommand", () => {
  it("parses a bare command", () => {
    expect(parseCommand("/start")).toEqual({ command: "start" });
  });

  it("parses a command with an argument", () => {
    expect(parseCommand("/bind abc123")).toEqual({ command: "bind", arg: "abc123" });
  });

  it("accepts the @botname suffix", () => {
    expect(parseCommand("/bind@TarimaBot abc123")).toEqual({ command: "bind", arg: "abc123" });
  });

  it("accepts a command without the slash", () => {
    expect(parseCommand("status p1")).toEqual({ command: "status", arg: "p1" });
  });

  it("falls back to help for unknown or empty input", () => {
    expect(parseCommand("/nope")).toEqual({ command: "help" });
    expect(parseCommand("")).toEqual({ command: "help" });
    expect(parseCommand("   ")).toEqual({ command: "help" });
  });

  it("keeps a multi word argument together", () => {
    expect(parseCommand("/bind a b")).toEqual({ command: "bind", arg: "a b" });
  });
});

describe("handleCommand", () => {
  it("answers /start with the usage text", async () => {
    const reply = await handleCommand({ chatId: 1, text: "/start" }, deps());
    expect(reply.text).toBe(usageText());
    expect(reply.text).toContain("/bind <projectId>");
  });

  it("binds a chat to a project", async () => {
    const store = new MemoryBindingStore();
    const reply = await handleCommand({ chatId: 7, text: "/bind p1" }, deps(store));
    expect(reply.text).toContain("p1");
    expect(store.get(7)).toBe("p1");
  });

  it("rejects a bind without a project id", async () => {
    const store = new MemoryBindingStore();
    const reply = await handleCommand({ chatId: 7, text: "/bind" }, deps(store));
    expect(reply.text).toContain("/bind <projectId>");
    expect(store.get(7)).toBeUndefined();
  });

  it("returns the digest for an explicit project", async () => {
    const reply = await handleCommand({ chatId: 7, text: "/status p1" }, deps());
    expect(reply.text).toContain("Project: Beta Launch");
    expect(reply.text).toContain("- Acme [chasing] missing: logo");
  });

  it("returns the digest of the bound project", async () => {
    const store = new MemoryBindingStore();
    store.set(7, "p1");
    const reply = await handleCommand({ chatId: 7, text: "/status" }, deps(store));
    expect(reply.text).toContain("Project: Beta Launch");
  });

  it("answers when no project is bound", async () => {
    const reply = await handleCommand({ chatId: 7, text: "/status" }, deps());
    expect(reply.text).toContain("/bind");
  });

  it("answers when the project does not exist", async () => {
    const reply = await handleCommand({ chatId: 7, text: "/status nope" }, deps());
    expect(reply.text).toContain("Unknown project nope");
  });

  it("unbinds a chat", async () => {
    const store = new MemoryBindingStore();
    store.set(7, "p1");
    const reply = await handleCommand({ chatId: 7, text: "/unbind" }, deps(store));
    expect(reply.text).toContain("p1");
    expect(store.get(7)).toBeUndefined();
  });

  it("answers when unbinding an unbound chat", async () => {
    const reply = await handleCommand({ chatId: 7, text: "/unbind" }, deps());
    expect(reply.text).toContain("not bound");
  });
});

describe("createTelegramBot", () => {
  it("returns null without a token", () => {
    expect(createTelegramBot({}, deps())).toBeNull();
    expect(createTelegramBot({ botToken: "  " }, deps())).toBeNull();
  });

  it("builds a bot with a token", () => {
    const bot = createTelegramBot({ botToken: "123:abc" }, deps());
    expect(bot).not.toBeNull();
  });
});

describe("createTelegramHandle", () => {
  it("pushes the digest to every chat bound to the project", async () => {
    const store = new MemoryBindingStore();
    store.set(1, "p1");
    store.set(2, "p1");
    store.set(3, "p2");

    const sent: Array<{ chatId: number; text: string }> = [];
    const fakeBot = {
      api: {
        async sendMessage(chatId: number, text: string) {
          sent.push({ chatId, text });
          return {};
        },
      },
    } as unknown as Parameters<typeof createTelegramHandle>[0];

    const handle = createTelegramHandle(fakeBot, deps(store));
    await handle.pushDigest("p1");

    expect(sent.map((s) => s.chatId).toSorted((a, b) => a - b)).toEqual([1, 2]);
    expect(sent[0]?.text).toContain("Project: Beta Launch");
  });

  it("skips a chat whose push fails and keeps going", async () => {
    const store = new MemoryBindingStore();
    store.set(1, "p1");
    store.set(2, "p1");

    const sent: number[] = [];
    const fakeBot = {
      api: {
        async sendMessage(chatId: number) {
          if (chatId === 1) throw new Error("chat is gone");
          sent.push(chatId);
          return {};
        },
      },
    } as unknown as Parameters<typeof createTelegramHandle>[0];

    const handle = createTelegramHandle(fakeBot, deps(store));
    await handle.pushDigest("p1");

    expect(sent).toEqual([2]);
  });

  it("pushes nothing for an unknown project", async () => {
    const sent: number[] = [];
    const fakeBot = {
      api: {
        async sendMessage(chatId: number) {
          sent.push(chatId);
          return {};
        },
      },
    } as unknown as Parameters<typeof createTelegramHandle>[0];

    const handle = createTelegramHandle(fakeBot, deps());
    await handle.pushDigest("nope");
    expect(sent).toEqual([]);
  });
});
