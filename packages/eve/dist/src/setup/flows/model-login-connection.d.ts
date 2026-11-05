import { type ModelConnectionSelection } from "#internal/model-auth/store.js";
import type { Prompter } from "#setup/prompter.js";
type Team = {
    teamId: string;
    teamName: string;
};
/** Evidence from this login attempt; credentials stay with their existing owner. */
export interface ValidatedModelConnection {
    selected: ModelConnectionSelection;
    team?: Team;
    availableModels?: string[];
}
export declare function reuseModelConnection(selected: ModelConnectionSelection, team: Team | undefined, signal?: AbortSignal): Promise<ValidatedModelConnection | undefined>;
export declare function authenticateModelConnection(input: {
    selected: ModelConnectionSelection;
    team?: Team;
    prompter: Prompter;
    signal?: AbortSignal;
}): Promise<ValidatedModelConnection>;
export {};
