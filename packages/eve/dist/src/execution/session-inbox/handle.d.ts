import type { Hook } from "#internal/workflow/runtime.js";
type InboxHook = Omit<Hook, "metadata">;
/** Opaque transport state; never includes user metadata or transient capabilities. */
export declare function issueInboxHandle(hook: unknown): string | undefined;
/** Verify the complete descriptor before using its routing or encryption fields. */
export declare function readInboxHandle(handle: string): InboxHook | undefined;
export {};
