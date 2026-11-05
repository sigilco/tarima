import { type Queue, type World } from '#compiled/@workflow/world/index.js';
import { z } from '#compiled/zod/index.js';
/** Runner protocol, not a hook-specific World operation. */
export declare const HookInvocationSchema: z.ZodObject<{
    type: z.ZodLiteral<"hook_resume">;
    version: z.ZodLiteral<1>;
    hookId: z.ZodString;
    token: z.ZodString;
    payload: z.ZodCustom<Uint8Array<ArrayBuffer>, Uint8Array<ArrayBuffer>>;
}, z.core.$strip>;
export declare const HookInvocationResultSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    status: z.ZodLiteral<"accepted">;
}, z.core.$strip>, z.ZodObject<{
    status: z.ZodLiteral<"rejected">;
    code: z.ZodEnum<{
        HOOK_NOT_FOUND: "HOOK_NOT_FOUND";
        INVALID_INPUT: "INVALID_INPUT";
    }>;
}, z.core.$strip>], "status">;
type HookInvocationResult = z.infer<typeof HookInvocationResultSchema>;
/** Validate a hook input and persist its event. World delivers the returned result. */
export declare function handleInvocation(world: World, runId: string, requestId: string, payload: unknown): Promise<HookInvocationResult>;
/** Track processed inputs and notify workflow execution when a run has new activity. */
export declare class RunInputActivity {
    revision: number;
    private listeners;
    notify(): void;
    waitForActivity(since: number, timeoutMs?: number): Promise<boolean>;
}
type Handler = Parameters<Queue['createQueueHandler']>[1];
type RunHandler = (...args: [...Parameters<Handler>, RunInputActivity?]) => ReturnType<Handler>;
/** Serialize a run's input processing and share its active execution within this handler. */
export declare function withRunInputs(world: World): (handler: RunHandler) => Handler;
export {};
//# sourceMappingURL=invocations.d.ts.map