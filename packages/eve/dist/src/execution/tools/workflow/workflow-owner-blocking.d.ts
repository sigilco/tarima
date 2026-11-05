import { type ChannelReader } from "#execution/tools/workflow/owner-channels.js";
import type { WorkflowToolRunMessage, WorkflowToolRunControlMessage } from "#execution/tools/workflow/messages.js";
import type { WorkflowToolRunInput } from "#execution/tools/workflow/types.js";
export interface BlockingWorkflowOwner {
    /** The session's commands, from the run's control hook. */
    readonly commands: ChannelReader<"control", WorkflowToolRunControlMessage>;
    /**
     * Waits until the control hook is registered, so the session's commands
     * reach the run, and resolves `false` when another run already holds its
     * token. A pending wait keeps the suspension that registers the hook from
     * running its steps inline, so call it only once the run needs the answer.
     */
    register(): Promise<boolean>;
    handleMessage(message: WorkflowToolRunMessage): Promise<void>;
    /**
     * Relays the body's messages to the session in one delivery, which is one
     * durable write: the session gets all of them or none, never a prefix.
     */
    relay(messages: readonly WorkflowToolRunMessage[]): Promise<void>;
}
/** The run's link to its session: commands arrive on its control hook, and its messages go to the session's inbox. */
export declare function createBlockingWorkflow(input: WorkflowToolRunInput): BlockingWorkflowOwner;
