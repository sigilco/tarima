import type { Prompter } from "#setup/prompter.js";
type LoginStage = "source_inspection" | "gateway_catalog" | "authentication" | "activation";
/** Fixed stage names and durations only: no credentials, team names, or provider responses. */
export declare function measureLoginStage<T>(stage: LoginStage, task: () => Promise<T>): Promise<T>;
/** Avoid painting a loading phase for quick local work. */
export declare function withLoginProgress<T>(prompter: Prompter, message: string, task: () => Promise<T>): Promise<T>;
export {};
