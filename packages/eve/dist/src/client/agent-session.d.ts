import type { SessionStreamEvent } from "#protocol/session-event.js";
import type { SessionReader } from "#shared/session.js";
import type { ClientSessionContext } from "#client/session.js";
import type { SessionStreamOptions } from "#client/types.js";
import { type DescendantHop } from "#protocol/descendant-observation.js";
/** A read-only child reached through recorded relationships on its parent's authorized reader. */
export declare class ClientAgentSession implements SessionReader {
    #private;
    readonly name: string;
    readonly id: string;
    readonly taskId: string | undefined;
    /** Built by the eve client when the parent stream opens this child. */
    constructor(context: ClientSessionContext, rootId: string, opened: Extract<SessionStreamEvent, {
        type: "child.opened";
    }>, children?: readonly DescendantHop[]);
    /** Resolves a further recorded child through this reader, including remote proxy hops. */
    agent(opened: Extract<SessionStreamEvent, {
        type: "child.opened";
    }>): ClientAgentSession;
    /** Reads independently of its parent; `follow: false` stops at the captured durable tail. */
    stream(options?: SessionStreamOptions): AsyncGenerator<SessionStreamEvent>;
}
