import { type ChatGptCredentialStore } from "./credential-store.js";
import { type CodexAppServer, type CodexAppServerOptions } from "./codex-app-server.js";
import { type ChatGptToken } from "./token.js";
export type ChatGptAuthState = {
    readonly kind: "checking";
} | {
    readonly accountLabel?: string;
    readonly kind: "ready";
} | {
    readonly kind: "signed-out";
} | {
    readonly kind: "reauth-required";
} | {
    readonly kind: "unavailable";
    readonly reason: string;
};
export type { ChatGptToken } from "./token.js";
export interface CodexTokenBroker {
    credentialOwner(): ChatGptCredentialOwner | undefined;
    getToken(input: {
        readonly reason: "rejected" | "request";
    }): Promise<ChatGptToken>;
    refreshState(): Promise<ChatGptAuthState>;
    state(): ChatGptAuthState;
}
export type ChatGptCredentialOwner = "codex" | "eve";
interface CodexTokenBrokerOptions extends CodexAppServerOptions {
    readonly appServer?: CodexAppServer;
    readonly store?: ChatGptCredentialStore;
    readonly fetch?: typeof fetch;
    readonly now?: () => number;
}
export declare function createCodexTokenBroker(options?: CodexTokenBrokerOptions): CodexTokenBroker;
export declare function getDefaultCodexTokenBroker(): CodexTokenBroker;
