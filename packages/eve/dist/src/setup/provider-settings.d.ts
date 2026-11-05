import { type ModelConnectionSelection } from "#shared/model-connection.js";
export type ProviderSelection = ModelConnectionSelection;
export declare function providerSettingsPath(appRoot: string): string;
export declare function resolveAvailableProviders(appRoot: string, options?: {
    signal?: AbortSignal;
    env?: Record<string, string | undefined>;
}): Promise<readonly ProviderSelection[]>;
export declare function readProviderSelection(appRoot: string): Promise<ProviderSelection | undefined>;
export declare function readProviderSettingsSync(appRoot: string): ProviderSettings | undefined;
export interface ProviderSettings {
    selected: ProviderSelection;
    teamId?: string;
    teamName?: string;
    keySource?: "environment" | "secret";
}
export declare function providerSettingsMatch(appRoot: string, settings: ProviderSettings): Promise<boolean>;
export declare function writeProviderSelection(appRoot: string, selected: ProviderSelection, team?: {
    teamId: string;
    teamName: string;
}, keySource?: "environment" | "secret"): Promise<void>;
export declare function readProviderTeamSync(appRoot: string): {
    teamId: string;
    teamName: string;
} | undefined;
export declare function readProviderKeySourceSync(appRoot: string): "environment" | "secret" | undefined;
