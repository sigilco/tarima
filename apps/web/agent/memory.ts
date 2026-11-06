/**
 * Eve agent memory (plan W4): one persistent, model-maintained memory
 * file per tarima user.
 *
 * - `fileMemory()` (vendored `eve/memory/file`) owns the mechanics: a
 *   bounded indexed document recalled at every turn start, plus the
 *   `memory__save_memory` / `memory__remove_memory` tools.
 * - `memorySqliteBackend` (`agent/lib/memory-sqlite.ts`) stores the
 *   document in tarima's own SQLite, so memory survives restarts and is
 *   covered by the existing Litestream backup.
 * - `byPrincipal` (vendored `eve/memory/scope`) keys the document by
 *   the session's auth principal. Both surfaces already authenticate to
 *   `users.id` — the browser session cookie (`channels/eve.ts`) and the
 *   telegram bind (`channels/telegram.ts`) — so one user's memory is
 *   shared across channels and never leaks to another user. eve
 *   disables the slot entirely when no principal is present, which is
 *   the stranger treatment: an unbound telegram chat never opens an
 *   agent turn, so it can never read or write memory.
 */
import { fileMemory } from "eve/memory/file";
import { defineMemory } from "eve/memory";
import { byPrincipal } from "eve/memory/scope";
import { memorySqliteBackend } from "./lib/memory-sqlite";

export default defineMemory({
  description: "Persistent memory for the current user's preferences and stable facts.",
  provider: fileMemory({ backend: memorySqliteBackend }),
  scope: byPrincipal,
});
