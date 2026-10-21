/**
 * @tarima/telegram: the Tarima digest bot.
 *
 * The api creates the bot on boot when `TELEGRAM_BOT_TOKEN` is set and
 * otherwise runs without it. Everything data-bound (bindings, project
 * rows) is injected through the seams, so the package has no db code.
 */
export { digestForProject, DIGEST_MAX_ROWS } from "./digest.js";
export type { BotCommand, BotDeps, CommandReply, DigestSource, ParsedCommand } from "./bot.js";
export {
  createTelegramBot,
  handleCommand,
  parseCommand,
  startLongPoll,
  usageText,
  type BotContext,
  type BotLogger,
} from "./bot.js";
export { MemoryBindingStore, type BindingStore } from "./store.js";
export type {
  DigestInput,
  DigestRow,
  DigestTotals,
  TelegramChat,
  TelegramConfig,
} from "./types.js";
