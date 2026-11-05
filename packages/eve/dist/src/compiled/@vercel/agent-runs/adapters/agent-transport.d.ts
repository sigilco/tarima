import { type AgentHandoff } from "../core/delegation.js";
/** Host boundary for durable dispatch and authenticated remote transport. */
export declare function createAgentDelegationTransport(fetcher?: typeof fetch): {
    fetch: typeof fetch;
    transport: (fetcher: typeof fetch) => typeof fetch;
    receive<T>(headers: Headers, trusted: (handoff: AgentHandoff) => boolean, execute: (handoff?: AgentHandoff) => T): T;
    resume<T>(stored: AgentHandoff, execute: (handoff: AgentHandoff) => T): T;
};
