import type { SandboxSession } from "eve/sandbox";
import type { PreparedSelfModificationWorkspace } from "../git-workspace.js";
export type ProductionRegistryInstallResult = {
    readonly kind: "completed";
    readonly completedItems: readonly string[];
    readonly changedPaths: readonly string[];
    readonly deploymentRequired: boolean;
} | {
    readonly kind: "input-required";
    readonly installed: boolean;
    readonly question: unknown;
} | {
    readonly kind: "external-action-required";
    readonly installed: boolean;
    readonly message: string;
    readonly url: string;
    readonly userCode?: string;
} | {
    readonly kind: "failed" | "cancelled";
    readonly message: string;
};
export declare function assertOfficialRegistryAddress(address: string): void;
/** Installs only official items and rolls back this invocation's tree on terminal failure. */
export declare function installProductionRegistryItem(input: {
    readonly address: string;
    readonly answers?: Readonly<Record<string, unknown>>;
    readonly installed?: boolean;
    readonly sandbox: Pick<SandboxSession, "run">;
    readonly signal?: AbortSignal;
    readonly workspace: PreparedSelfModificationWorkspace;
}): Promise<ProductionRegistryInstallResult>;
export declare function acceptsNonSecretSetupAnswers(question: {
    readonly key: string;
    readonly kind: string;
}, answers: Readonly<Record<string, unknown>>): boolean;
interface PackageRoot {
    readonly kind: "npm" | "pnpm";
    readonly root: string;
}
export declare function locatePackageManagerRoot(sandbox: Pick<SandboxSession, "run">, applicationRoot: string, repositoryRoot: string, signal?: AbortSignal): Promise<PackageRoot | undefined>;
export declare function bootstrapCommand(root: PackageRoot): string;
export {};
