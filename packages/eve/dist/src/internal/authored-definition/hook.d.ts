import type { SessionEvent } from "#protocol/session-event.js";
import { type StreamEventHook } from "#public/definitions/hook.js";
import type { ModuleSourceRef } from "#shared/source-ref.js";
/** A hook export's handlers, by the event they handle: `{ events?: { [event]: handler } }`. */
export declare function normalizeHookHandlers(value: unknown, source: Pick<ModuleSourceRef, "exportName" | "logicalPath">): Readonly<Record<string, StreamEventHook<SessionEvent>>>;
