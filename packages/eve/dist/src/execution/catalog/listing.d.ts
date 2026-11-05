import type { Announcement } from "#harness/announcements.js";
import type { Callable } from "./step-catalog.js";
/** What the listing reads of what a step can run. */
type Listed = Pick<Callable, "connections" | "deferred" | "entries" | "skills">;
/**
 * Announces the catalog: the kinds of deferred entries, their namespaces, and
 * the connections, then the whole listing again whenever that changes.
 * Connection tools stay unlisted, since listing them needs a network call and
 * maybe a sign-in. An empty catalog the model never heard of has nothing to announce.
 */
export declare function catalogAnnouncements(catalog: Listed): Readonly<Record<string, Announcement>>;
export {};
