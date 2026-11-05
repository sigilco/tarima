import type { SandboxSession } from "eve/sandbox";
export interface BrokeredCredentialOptions {
    readonly token: string;
    /**
     * `firewall` keeps the token outside the sandbox. `command` writes it into
     * git config or the CLI environment for backends without network policies.
     */
    readonly delivery?: "firewall" | "command";
    /** Consumer-owned network-policy merge for hosts and their injected headers. */
    readonly broker?: (sandbox: SandboxSession, rules: Record<string, Record<string, string>>) => Promise<void>;
}
export declare function authenticateGitHub(sandbox: SandboxSession, options: BrokeredCredentialOptions): Promise<void>;
export declare function authenticateVercel(sandbox: SandboxSession, options: BrokeredCredentialOptions): Promise<void>;
