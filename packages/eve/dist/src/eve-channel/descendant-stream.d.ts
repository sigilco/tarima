import { type Session } from "#channel/session.js";
import { type RemoteAgentBinding } from "#eve-channel/support.js";
/** Every hop resolves recorded authority on its owning deployment, never an event-supplied URL. */
export declare function descendantStreamResponse(input: {
    readonly request: Request;
    readonly root: Session;
    readonly attachSession: (id: string) => Session;
    readonly resolveHeaders?: (binding: RemoteAgentBinding) => Promise<Record<string, string>>;
}): Promise<Response>;
