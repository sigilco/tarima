import { Link } from "@tanstack/react-router";
import * as m from "../paraglide/messages.js";
import type { MessageWire } from "../lib/api";

/**
 * The board's inbox panel (Stage B, channels stream).
 *
 * A minimal notification surface: the unread counter next to the title
 * and the last messages under it. There is no chat UI yet, that is
 * post-beta: the panel only shows what the agent sent and links to the
 * settings page where the channels are connected.
 */
export function InboxPanel({
  messages,
  unread,
}: {
  messages: readonly MessageWire[];
  unread: number;
}) {
  const recent = messages.slice(0, 5);

  return (
    <section className="mt-4 rounded-2xl border border-border-subtle bg-surface-raised p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-[13px] font-semibold text-content">
          {m["board.inbox"]()}
          {unread > 0 ? (
            <span className="rounded-full bg-content px-2 py-0.5 text-[11px] font-medium text-surface">
              {unread} {m["board.inboxUnread"]()}
            </span>
          ) : null}
        </h2>
        <Link
          to="/app/settings"
          className="text-[12.5px] text-content-muted transition-colors hover:text-content"
        >
          {m["board.settings"]()}
        </Link>
      </div>

      {recent.length === 0 ? (
        <p className="mt-3 text-[13px] text-content-faint">{m["board.inboxEmpty"]()}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {recent.map((msg) => (
            <li key={msg.id} className="flex items-start gap-2">
              {!msg.read ? (
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-content" />
              ) : (
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0" />
              )}
              <span className="min-w-0 text-[13px] text-content-muted">{msg.summary}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
