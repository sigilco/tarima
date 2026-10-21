/**
 * Minimal domain types for the Telegram digest bot.
 *
 * The package owns only the bot mechanics: command parsing, chat to
 * project bindings and digest rendering. Everything that touches the
 * database (binding persistence, entity lookup) is injected through the
 * `BindingStore` and `DigestSource` seams defined in `store.ts` and
 * `index.ts`, so this package never imports drizzle or the api.
 */

/** Bot configuration; an absent token disables the bot entirely. */
export interface TelegramConfig {
  /** Telegram bot token; when unset the bot is a no-op. */
  botToken?: string;
  /** Optional Bot API base override (self-hosted proxy, tests). */
  apiBase?: string;
}

/** A chat bound to a project: digest notifications land here. */
export interface TelegramChat {
  chatId: number;
  projectId: string;
}

/** Status totals carried alongside the rows in a digest. */
export interface DigestTotals {
  done: number;
  chasing: number;
  awaiting: number;
  blocked: number;
  total: number;
}

/** One board row inside a digest message. */
export interface DigestRow {
  name: string;
  status: string;
  missing?: string[];
}

/** Everything `digestForProject` needs to render one digest message. */
export interface DigestInput {
  projectId: string;
  projectName: string;
  rows: DigestRow[];
  totals: DigestTotals;
}
