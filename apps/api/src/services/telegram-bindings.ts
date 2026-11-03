/**
 * Sqlite-backed Telegram binding store (Stage B, channels stream).
 *
 * Replaces the in-memory `MemoryBindingStore` the api used until now:
 * the binding lives in the `channel_bindings` table, so a restart does
 * not lose the chat a user connected.
 *
 * ONE ROW, TWO JOBS. A chat has a single row in `channel_bindings`
 * (the unique index covers channel + external id), and that row carries
 * both bindings of the chat:
 *
 *   - the user binding: `user_id` is the account the chat belongs to.
 *     The connect flow writes it when a tester sends their code.
 *   - the project binding: `label` is `project:<projectId>` when the
 *     chat also wants the digest of that project.
 *
 * So `/bind <projectId>` only sets the label and never touches the user
 * binding, and unbinding a project clears the label instead of deleting
 * the row (deleting it would drop the notification binding too).
 */
import { and, eq } from "drizzle-orm";
import type { BindingStore } from "@tarima/telegram";
import type { ApiDb } from "./projects";
import { channelBindings } from "../db/schema";

/** Label prefix that marks a row as a project binding (digest). */
const PROJECT_PREFIX = "project:";

/**
 * Bindings of one chat, read through the `channel_bindings` table.
 *
 * A chat that has never been connected has no row, so it has no
 * account either: a project bind on such a chat is a no-op. The tester
 * connects the chat first (the settings page gives them a code).
 */
export class SqliteBindingStore implements BindingStore {
  constructor(private readonly db: ApiDb) {}

  /** Bind (or rebind) a chat to a project. */
  set(chatId: number, projectId: string): void {
    const row = this.rowOf(chatId);
    if (!row) return;
    this.db
      .update(channelBindings)
      .set({ label: `${PROJECT_PREFIX}${projectId}` })
      .where(eq(channelBindings.id, row.id))
      .run();
  }

  /** The project a chat is bound to, or undefined when it is not bound. */
  get(chatId: number): string | undefined {
    const row = this.rowOf(chatId);
    if (!row) return undefined;
    const label = row.label ?? "";
    return label.startsWith(PROJECT_PREFIX) ? label.slice(PROJECT_PREFIX.length) : undefined;
  }

  /** Drop a chat's project binding; unbinding an unbound chat is a no-op. */
  remove(chatId: number): void {
    const row = this.rowOf(chatId);
    if (!row) return;
    this.db
      .update(channelBindings)
      .set({ label: null })
      .where(eq(channelBindings.id, row.id))
      .run();
  }

  /** Every chat id bound to a project, for digest fan-out. */
  listForProject(projectId: string): number[] {
    return this.db
      .select({ externalId: channelBindings.externalId })
      .from(channelBindings)
      .where(
        and(
          eq(channelBindings.channel, "telegram"),
          eq(channelBindings.label, `${PROJECT_PREFIX}${projectId}`),
        ),
      )
      .all()
      .map((row) => Number(row.externalId))
      .filter((chatId) => Number.isFinite(chatId));
  }

  /** The row of a chat (its user binding, with or without a project). */
  private rowOf(chatId: number): typeof channelBindings.$inferSelect | undefined {
    return this.db
      .select()
      .from(channelBindings)
      .where(
        and(
          eq(channelBindings.channel, "telegram"),
          eq(channelBindings.externalId, String(chatId)),
        ),
      )
      .get();
  }
}
