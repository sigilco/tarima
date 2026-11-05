import type { TargetTools } from "#evals/target.js";
/**
 * Throws for a tool name no call is reported under, so an assertion on it can't
 * pass or fail without saying why. A retired name outside the `eve` namespace
 * is still an ordinary tool name, so it passes when the root agent declares a
 * tool by that name, has a dynamic tool resolver that might return one, or its
 * tools are unknown.
 */
export declare function assertReportedToolName(name: string, tools: TargetTools | undefined): void;
