import { type Session } from "#context/keys.js";
import type { ContextReader } from "#context/key.js";
import type { HarnessSession } from "#harness/types.js";
export declare const sessionProvider: {
    key: import("#context/key.js").ContextKey<Session>;
    create(ctx: ContextReader, session: Pick<HarnessSession, "state">): {
        value: Readonly<{
            auth: {
                current: import("#context/keys.js").SessionAuthContext | null;
                initiator: import("#context/keys.js").SessionAuthContext | null;
            };
            parent: import("#context/keys.js").SessionParent | undefined;
            predecessor: import("#context/keys.js").SessionPredecessor | undefined;
            sessionId: string;
            turn: {
                id: string;
                sequence: number;
            };
        }>;
    };
};
