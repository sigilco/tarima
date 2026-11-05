import { type ChatGptCredentialStore } from "#public/models/openai/chatgpt/credential-store.js";
import { type CodexTokenBroker } from "#public/models/openai/chatgpt/token-broker.js";
interface ChatGptAuthOptions {
    readonly signal?: AbortSignal;
    readonly broker?: CodexTokenBroker;
    readonly codexLogin?: (signal?: AbortSignal) => Promise<void>;
    readonly store?: ChatGptCredentialStore;
    readonly fetch?: typeof fetch;
    readonly open?: (url: string) => void;
    readonly log?: (message: string) => void;
    readonly headless?: boolean;
}
/** Signs in through the credential owner selected by the ChatGPT auth facade. */
export declare function ensureChatGptAuth(options?: ChatGptAuthOptions): Promise<void>;
export {};
