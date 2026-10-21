/**
 * Telegram bot: grammY based, long-polling friendly.
 *
 * The bot is deliberately dumb about data: it parses commands, renders
 * digests through the pure `digestForProject` function and stores chat
 * bindings through the `BindingStore` seam. The project data itself comes
 * from the injected `DigestSource`, which the api wires to its own
 * services. That keeps this package free of db code and lets the tests
 * drive every command without a live Telegram API.
 */
import { Bot, type Context } from "grammy";
import { digestForProject } from "./digest.js";
import type { BindingStore } from "./store.js";
import type { TelegramConfig } from "./types.js";

/** The commands the bot answers. */
export type BotCommand = "start" | "bind" | "status" | "unbind" | "help";

/** A parsed command: the name plus its single argument, if any. */
export interface ParsedCommand {
  command: BotCommand;
  arg?: string;
}

/** The commands, in the order the help text lists them. */
const COMMANDS: BotCommand[] = ["start", "bind", "status", "unbind", "help"];

/**
 * Parse a command line into a command and its argument.
 *
 * Accepts `/name`, `/name@BotName` and `name`, with an optional
 * argument after whitespace. Unknown commands come back as `help`, so a
 * typo answers with the usage text instead of silently doing nothing.
 */
export function parseCommand(text: string): ParsedCommand {
  const trimmed = (text ?? "").trim();
  if (trimmed.length === 0) return { command: "help" };

  const [rawName = "", ...rest] = trimmed.split(/\s+/);
  const name = rawName.replace(/^\//, "").split("@")[0]?.toLowerCase() ?? "";
  const arg = rest.join(" ").trim();

  if (!(COMMANDS as string[]).includes(name)) return { command: "help" };

  const command = name as BotCommand;
  return arg.length > 0 ? { command, arg } : { command };
}

/** The welcome text, also used as the help text. */
export function usageText(): string {
  return [
    "Tarima Telegram bot",
    "",
    "Commands:",
    "/start - show this help",
    "/bind <projectId> - bind this chat to a project",
    "/status [projectId] - show the project digest",
    "/unbind - unbind this chat from its project",
  ].join("\n");
}

/** How the bot answers a `/status` request. */
export interface DigestSource {
  /** The digest of a project, or null when the project does not exist. */
  digest(projectId: string): Promise<import("./types.js").DigestInput | null>;
}

/** What the bot needs from its host. */
export interface BotDeps {
  store: BindingStore;
  source: DigestSource;
}

/** The answer to a command, ready to send back to the chat. */
export interface CommandReply {
  text: string;
}

/**
 * Handle one command. Pure with respect to Telegram: it reads the store
 * and the digest source and returns the reply text, so the whole command
 * surface is unit-testable without a bot instance.
 */
export async function handleCommand(
  ctx: { chatId: number; text: string },
  deps: BotDeps,
): Promise<CommandReply> {
  const { command, arg } = parseCommand(ctx.text);

  switch (command) {
    case "start":
    case "help":
      return { text: usageText() };

    case "bind": {
      if (!arg) return { text: "Usage: /bind <projectId>" };
      deps.store.set(ctx.chatId, arg);
      return { text: `Bound this chat to project ${arg}.` };
    }

    case "unbind": {
      const projectId = deps.store.get(ctx.chatId);
      if (!projectId) return { text: "This chat is not bound to a project." };
      deps.store.remove(ctx.chatId);
      return { text: `Unbound this chat from project ${projectId}.` };
    }

    case "status": {
      const projectId = arg ?? deps.store.get(ctx.chatId);
      if (!projectId) {
        return { text: "No project bound. Use /bind <projectId> first." };
      }
      const input = await deps.source.digest(projectId);
      if (!input) return { text: `Unknown project ${projectId}.` };
      return { text: digestForProject(input) };
    }
  }
}

/** Register the command handlers on a grammY bot. */
function registerHandlers(bot: Bot, deps: BotDeps): void {
  bot.command("start", async (ctx) => {
    await ctx.reply((await handleCommand({ chatId: ctx.chat.id, text: "start" }, deps)).text);
  });

  bot.command("bind", async (ctx) => {
    const reply = await handleCommand({ chatId: ctx.chat.id, text: `bind ${ctx.match}` }, deps);
    await ctx.reply(reply.text);
  });

  bot.command("status", async (ctx) => {
    const reply = await handleCommand(
      { chatId: ctx.chat.id, text: `status ${ctx.match ?? ""}` },
      deps,
    );
    await ctx.reply(reply.text);
  });

  bot.command("unbind", async (ctx) => {
    const reply = await handleCommand({ chatId: ctx.chat.id, text: "unbind" }, deps);
    await ctx.reply(reply.text);
  });

  // Any other message answers with the usage text, so a stranger typing
  // "hi" gets a hint instead of silence.
  bot.on("message:text", async (ctx) => {
    const reply = await handleCommand({ chatId: ctx.chat.id, text: ctx.message.text }, deps);
    await ctx.reply(reply.text);
  });
}

/**
 * Create the bot. Returns null when no token is configured: the api then
 * runs without Telegram, which keeps local dev and CI free of bot setup.
 */
export function createTelegramBot(config: TelegramConfig, deps: BotDeps): Bot | null {
  const token = config.botToken?.trim();
  if (!token) return null;

  const bot = new Bot(token, config.apiBase ? { client: { apiRoot: config.apiBase } } : undefined);
  registerHandlers(bot, deps);
  return bot;
}

/** The grammY context type the bot handlers use. */
export type BotContext = Context;

/** Log sink for the long-polling loop; the api can replace it. */
export type BotLogger = (message: string, error?: unknown) => void;

/** Backoff schedule (ms) between long-polling retries. */
const RETRY_BACKOFF_MS = [1000, 2000, 5000, 10000, 30000] as const;

/**
 * Start long polling. The returned promise resolves when polling stops
 * (bot stopped) and never rejects: network errors are logged and retried
 * with a capped backoff, so a flaky network cannot crash the api.
 */
export async function startLongPoll(bot: Bot, log: BotLogger = defaultLogger): Promise<void> {
  await pollWithRetry(bot, log, 0);
}

/**
 * One polling attempt plus its retries. Written recursively (not as a
 * loop) because the attempts are strictly sequential: the next poll must
 * not start before the previous one ended and the backoff elapsed.
 */
async function pollWithRetry(bot: Bot, log: BotLogger, attempt: number): Promise<void> {
  try {
    await bot.start({
      drop_pending_updates: true,
      onStart: (info) => log(`telegram bot started as @${info.username}`),
    });
  } catch (error) {
    const delay = RETRY_BACKOFF_MS[Math.min(attempt, RETRY_BACKOFF_MS.length - 1)] ?? 30000;
    log("telegram long poll failed, retrying", error);
    await sleep(delay);
    await pollWithRetry(bot, log, attempt + 1);
  }
}

/** Promise that resolves after `ms` milliseconds. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Default logger: stderr, so the api log keeps its own format. */
function defaultLogger(message: string, error?: unknown): void {
  if (error === undefined) console.error(`[telegram] ${message}`);
  else console.error(`[telegram] ${message}`, error);
}
