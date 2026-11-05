import type { Commit } from "#harness/types.js";
import type { FactOf } from "#protocol/session-events/facts.js";
type Scope = {
    readonly turnId: string;
    readonly taskId?: string | undefined;
};
/** A session a call's run opened, and the route that serves its stream. */
export declare function openChild(data: FactOf<"child.opened">["data"], scope: Scope): Commit;
/** A message a call's run sent the session it opened. */
export declare function recordChildSent(data: FactOf<"child.sent">["data"], scope: Scope): Commit;
export {};
