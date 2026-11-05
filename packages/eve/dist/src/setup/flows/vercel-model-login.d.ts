import type { Prompter } from "#setup/prompter.js";
export declare function loginVercelModel(prompter: Prompter, signal?: AbortSignal, preferredTeamId?: string): Promise<{
    teamId: string;
    teamName: string;
}>;
