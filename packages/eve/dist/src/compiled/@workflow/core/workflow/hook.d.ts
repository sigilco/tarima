import type { Hook, HookOptions } from '../create-hook.js';
import { type WorkflowOrchestratorContext } from '../private.js';
/**
 * The error `createHook()` throws when it opens the run's start Hook with
 * options only a write could apply. Shared with the QuickJS guest's message.
 */
export declare function startHookOptionsError(rejected: readonly string[]): string;
export declare function createCreateHook(ctx: WorkflowOrchestratorContext): <T = any>(options?: HookOptions) => Hook<T>;
//# sourceMappingURL=hook.d.ts.map