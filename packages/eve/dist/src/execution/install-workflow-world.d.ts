import { type ValidateWorkflowWorldInput } from "#internal/workflow/validate-world.js";
/**
 * Validates a Workflow World, installs it as the runtime singleton, and
 * starts it. Generated World plugins call this so eve owns what wraps the
 * World before its queue begins delivering.
 */
export declare function installWorkflowWorld(input: ValidateWorkflowWorldInput): Promise<void>;
/**
 * Closes the installed World when the server closes. A World's queue keeps
 * timers, such as a pending `sleep` or a delivery retry, that would otherwise
 * keep a stopped server process alive. Never rejects and never outlasts its
 * timeout: Nitro runs `close` hooks in sequence and stops at the first
 * rejection, and sandbox shutdown and the trace flush run after this hook.
 */
export declare function closeWorkflowWorld(): Promise<void>;
