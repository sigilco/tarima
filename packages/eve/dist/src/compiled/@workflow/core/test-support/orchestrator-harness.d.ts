import type { Event } from '#compiled/@workflow/world/index.js';
import { AppendOnlyWorld, type HeldMessage } from './append-only-world.js';
/** The orchestrator queue of a workflow named `workflow`. */
export declare const ORCHESTRATOR_QUEUE = "__wkf_workflow_workflow";
/** Registers `name` as the workflow of a test's workflow code. */
export declare function registerWorkflow(name?: string): string;
/**
 * Seeds a run of `code` on a fresh {@link AppendOnlyWorld}, installs it as the
 * World, registers the queue handler, and enqueues the run's start message
 * (not delivered).
 */
export declare function setupOrchestratorRun(code: string, args: unknown[], options?: ConstructorParameters<typeof AppendOnlyWorld>[0], engine?: 'node' | 'quickjs'): Promise<{
    world: AppendOnlyWorld;
    runId: string;
    start: HeldMessage;
}>;
export declare const eventsOf: (world: AppendOnlyWorld, type: string) => (({
    eventType: "run_created";
    eventData: {
        deploymentId: string;
        workflowName: string;
        input: unknown;
        executionContext?: Record<string, any> | undefined;
        attributes?: Record<string, string> | undefined;
        allowReservedAttributes?: true | undefined;
        dynamicWorkflowCode?: unknown;
        dynamicWorkflowCodeRef?: string | undefined;
        encryptionPublicKey?: string | undefined;
        startHook?: {
            token: string;
            hookId?: string | undefined;
            tokenRetentionUntil?: Date | undefined;
            metadata?: unknown;
        } | undefined;
    };
    correlationId?: string | undefined;
    specVersion?: number | undefined;
} | {
    eventType: "run_started";
    correlationId?: string | undefined;
    specVersion?: number | undefined;
    eventData?: {
        input?: unknown;
        deploymentId?: string | undefined;
        workflowName?: string | undefined;
        executionContext?: Record<string, any> | undefined;
        attributes?: Record<string, string> | undefined;
        allowReservedAttributes?: true | undefined;
        encryptionPublicKey?: string | undefined;
        dynamicWorkflowCode?: unknown;
        dynamicWorkflowCodeRef?: string | undefined;
        startHook?: {
            token: string;
            hookId?: string | undefined;
            tokenRetentionUntil?: Date | undefined;
            metadata?: unknown;
        } | undefined;
    } | undefined;
} | {
    eventType: "run_completed";
    eventData: {
        output?: unknown;
    };
    correlationId?: string | undefined;
    specVersion?: number | undefined;
} | {
    eventType: "run_failed";
    eventData: {
        error: unknown;
        errorCode?: string | undefined;
    };
    correlationId?: string | undefined;
    specVersion?: number | undefined;
} | {
    eventType: "run_cancelled";
    correlationId?: string | undefined;
    specVersion?: number | undefined;
    eventData?: {
        cancelReason?: string | undefined;
    } | undefined;
} | {
    eventType: "attr_set";
    eventData: {
        changes: {
            key: string;
            value: string | null;
        }[];
        writer: {
            type: "workflow";
        } | {
            type: "step";
            stepId: string;
            attempt: number;
        };
        allowReservedAttributes?: true | undefined;
    };
    specVersion?: number | undefined;
    correlationId?: string | undefined;
} | {
    eventType: "step_created";
    correlationId: string;
    eventData: {
        stepName: string;
        input: unknown;
        workflowName?: string | undefined;
        inline?: boolean | undefined;
        creatorMessageId?: string | undefined;
    };
    specVersion?: number | undefined;
} | {
    eventType: "step_completed";
    correlationId: string;
    eventData: {
        result: unknown;
        ttfs?: number | undefined;
        stso?: number | undefined;
        stepCount?: number | undefined;
        eventCount?: number | undefined;
        rsfs?: number | undefined;
        finalSchedulingReplay?: number | undefined;
        optimizations?: string[] | undefined;
        stepName?: string | undefined;
        workflowName?: string | undefined;
    };
    specVersion?: number | undefined;
} | {
    eventType: "step_failed";
    correlationId: string;
    eventData: {
        error: unknown;
        ttfs?: number | undefined;
        stso?: number | undefined;
        stepCount?: number | undefined;
        eventCount?: number | undefined;
        rsfs?: number | undefined;
        finalSchedulingReplay?: number | undefined;
        optimizations?: string[] | undefined;
        stepName?: string | undefined;
        attempt?: number | undefined;
    };
    specVersion?: number | undefined;
} | {
    eventType: "step_retrying";
    correlationId: string;
    eventData: {
        error: unknown;
        stepName?: string | undefined;
        retryAfter?: Date | undefined;
        attempt?: number | undefined;
        creatorMessageId?: string | undefined;
    };
    specVersion?: number | undefined;
} | {
    eventType: "step_started";
    correlationId: string;
    specVersion?: number | undefined;
    eventData?: {
        stepName?: string | undefined;
        attempt?: number | undefined;
        workflowName?: string | undefined;
        input?: unknown;
        inline?: boolean | undefined;
        ownerMessageId?: string | undefined;
    } | undefined;
} | {
    eventType: "hook_created";
    correlationId: string;
    eventData: {
        token: string;
        tokenRetentionUntil?: Date | undefined;
        metadata?: unknown;
        isWebhook?: boolean | undefined;
        isSystem?: boolean | undefined;
        force?: boolean | undefined;
        forceClaimedFrom?: {
            runId: string;
            hookId: string;
            workflowName?: string | undefined;
            deploymentId?: string | undefined;
            runSpecVersion?: number | undefined;
        } | undefined;
    };
    specVersion?: number | undefined;
} | {
    eventType: "hook_received";
    correlationId: string;
    eventData: {
        payload: unknown;
        token?: string | undefined;
    };
    specVersion?: number | undefined;
} | {
    eventType: "hook_disposed";
    correlationId: string;
    specVersion?: number | undefined;
    eventData?: {
        token?: string | undefined;
        forceClaimedBy?: {
            runId: string;
            hookId: string;
        } | undefined;
    } | undefined;
} | {
    eventType: "hook_conflict";
    correlationId: string;
    eventData: {
        token: string;
        conflictingRunId?: string | undefined;
        forceRefusedReason?: "victim-spec-version" | undefined;
    };
    specVersion?: number | undefined;
} | {
    eventType: "wait_created";
    correlationId: string;
    eventData: {
        resumeAt: Date;
        creatorMessageId?: string | undefined;
    };
    specVersion?: number | undefined;
} | {
    eventType: "wait_completed";
    correlationId: string;
    specVersion?: number | undefined;
    eventData?: {
        resumeAt?: Date | undefined;
    } | undefined;
} | {
    eventType: "noop";
    correlationId?: string | undefined;
    specVersion?: number | undefined;
    eventData?: {
        [x: string]: unknown;
        sealed?: boolean | undefined;
    } | undefined;
}) & {
    runId: string;
    eventId: string;
    createdAt: Date;
    occurredAt?: Date | undefined;
    specVersion?: number | undefined;
    resumeId?: string | undefined;
})[];
export declare const dataOf: (event: Event | undefined) => Record<string, unknown> | undefined;
/**
 * Each step's creation: a background step's `step_created`, or an inline
 * step's creation-bearing first `step_started` (`inline: true`).
 */
export declare const creationsOf: (world: AppendOnlyWorld) => (({
    eventType: "run_created";
    eventData: {
        deploymentId: string;
        workflowName: string;
        input: unknown;
        executionContext?: Record<string, any> | undefined;
        attributes?: Record<string, string> | undefined;
        allowReservedAttributes?: true | undefined;
        dynamicWorkflowCode?: unknown;
        dynamicWorkflowCodeRef?: string | undefined;
        encryptionPublicKey?: string | undefined;
        startHook?: {
            token: string;
            hookId?: string | undefined;
            tokenRetentionUntil?: Date | undefined;
            metadata?: unknown;
        } | undefined;
    };
    correlationId?: string | undefined;
    specVersion?: number | undefined;
} | {
    eventType: "run_started";
    correlationId?: string | undefined;
    specVersion?: number | undefined;
    eventData?: {
        input?: unknown;
        deploymentId?: string | undefined;
        workflowName?: string | undefined;
        executionContext?: Record<string, any> | undefined;
        attributes?: Record<string, string> | undefined;
        allowReservedAttributes?: true | undefined;
        encryptionPublicKey?: string | undefined;
        dynamicWorkflowCode?: unknown;
        dynamicWorkflowCodeRef?: string | undefined;
        startHook?: {
            token: string;
            hookId?: string | undefined;
            tokenRetentionUntil?: Date | undefined;
            metadata?: unknown;
        } | undefined;
    } | undefined;
} | {
    eventType: "run_completed";
    eventData: {
        output?: unknown;
    };
    correlationId?: string | undefined;
    specVersion?: number | undefined;
} | {
    eventType: "run_failed";
    eventData: {
        error: unknown;
        errorCode?: string | undefined;
    };
    correlationId?: string | undefined;
    specVersion?: number | undefined;
} | {
    eventType: "run_cancelled";
    correlationId?: string | undefined;
    specVersion?: number | undefined;
    eventData?: {
        cancelReason?: string | undefined;
    } | undefined;
} | {
    eventType: "attr_set";
    eventData: {
        changes: {
            key: string;
            value: string | null;
        }[];
        writer: {
            type: "workflow";
        } | {
            type: "step";
            stepId: string;
            attempt: number;
        };
        allowReservedAttributes?: true | undefined;
    };
    specVersion?: number | undefined;
    correlationId?: string | undefined;
} | {
    eventType: "step_created";
    correlationId: string;
    eventData: {
        stepName: string;
        input: unknown;
        workflowName?: string | undefined;
        inline?: boolean | undefined;
        creatorMessageId?: string | undefined;
    };
    specVersion?: number | undefined;
} | {
    eventType: "step_completed";
    correlationId: string;
    eventData: {
        result: unknown;
        ttfs?: number | undefined;
        stso?: number | undefined;
        stepCount?: number | undefined;
        eventCount?: number | undefined;
        rsfs?: number | undefined;
        finalSchedulingReplay?: number | undefined;
        optimizations?: string[] | undefined;
        stepName?: string | undefined;
        workflowName?: string | undefined;
    };
    specVersion?: number | undefined;
} | {
    eventType: "step_failed";
    correlationId: string;
    eventData: {
        error: unknown;
        ttfs?: number | undefined;
        stso?: number | undefined;
        stepCount?: number | undefined;
        eventCount?: number | undefined;
        rsfs?: number | undefined;
        finalSchedulingReplay?: number | undefined;
        optimizations?: string[] | undefined;
        stepName?: string | undefined;
        attempt?: number | undefined;
    };
    specVersion?: number | undefined;
} | {
    eventType: "step_retrying";
    correlationId: string;
    eventData: {
        error: unknown;
        stepName?: string | undefined;
        retryAfter?: Date | undefined;
        attempt?: number | undefined;
        creatorMessageId?: string | undefined;
    };
    specVersion?: number | undefined;
} | {
    eventType: "step_started";
    correlationId: string;
    specVersion?: number | undefined;
    eventData?: {
        stepName?: string | undefined;
        attempt?: number | undefined;
        workflowName?: string | undefined;
        input?: unknown;
        inline?: boolean | undefined;
        ownerMessageId?: string | undefined;
    } | undefined;
} | {
    eventType: "hook_created";
    correlationId: string;
    eventData: {
        token: string;
        tokenRetentionUntil?: Date | undefined;
        metadata?: unknown;
        isWebhook?: boolean | undefined;
        isSystem?: boolean | undefined;
        force?: boolean | undefined;
        forceClaimedFrom?: {
            runId: string;
            hookId: string;
            workflowName?: string | undefined;
            deploymentId?: string | undefined;
            runSpecVersion?: number | undefined;
        } | undefined;
    };
    specVersion?: number | undefined;
} | {
    eventType: "hook_received";
    correlationId: string;
    eventData: {
        payload: unknown;
        token?: string | undefined;
    };
    specVersion?: number | undefined;
} | {
    eventType: "hook_disposed";
    correlationId: string;
    specVersion?: number | undefined;
    eventData?: {
        token?: string | undefined;
        forceClaimedBy?: {
            runId: string;
            hookId: string;
        } | undefined;
    } | undefined;
} | {
    eventType: "hook_conflict";
    correlationId: string;
    eventData: {
        token: string;
        conflictingRunId?: string | undefined;
        forceRefusedReason?: "victim-spec-version" | undefined;
    };
    specVersion?: number | undefined;
} | {
    eventType: "wait_created";
    correlationId: string;
    eventData: {
        resumeAt: Date;
        creatorMessageId?: string | undefined;
    };
    specVersion?: number | undefined;
} | {
    eventType: "wait_completed";
    correlationId: string;
    specVersion?: number | undefined;
    eventData?: {
        resumeAt?: Date | undefined;
    } | undefined;
} | {
    eventType: "noop";
    correlationId?: string | undefined;
    specVersion?: number | undefined;
    eventData?: {
        [x: string]: unknown;
        sealed?: boolean | undefined;
    } | undefined;
}) & {
    runId: string;
    eventId: string;
    createdAt: Date;
    occurredAt?: Date | undefined;
    specVersion?: number | undefined;
    resumeId?: string | undefined;
})[];
/** The hydrated return value of the run's `run_completed`, if any. */
export declare function runResult(world: AppendOnlyWorld): Promise<unknown>;
/** Queue calls that are step messages. */
export declare const stepMessagesOf: (world: AppendOnlyWorld) => import("./append-only-world.js").RecordedQueueCall[];
/** Queue calls that are orchestrator messages (wakes and timers). */
export declare const orchestratorMessagesOf: (world: AppendOnlyWorld) => import("./append-only-world.js").RecordedQueueCall[];
/**
 * Asserts that a delivery stood down by acknowledging its message: it
 * returned nothing, the World no longer holds the message, and, after
 * `orchestratorCallsBefore` (the count of orchestrator queue calls before it
 * ran), it sent `wakes` plain orchestrator wakes (no timer, no message-only
 * state) besides the step messages and timers its own writes owed.
 */
export declare function expectAcknowledged(world: AppendOnlyWorld, result: unknown, message: {
    messageId: string;
}, orchestratorCallsBefore?: number, wakes?: number): void;
/**
 * Asserts that a delivery the in-band fence refused stood down the way every
 * refused delivery does: it asked for a counted redelivery of its own
 * message (`{ timeoutSeconds }`), the World holds that message with the next
 * delivery count, and, after `orchestratorCallsBefore` (the count of
 * orchestrator queue calls before it ran), it sent no plain orchestrator
 * wake. Returns the held redelivery.
 */
export declare function expectRefusalRedelivery(world: AppendOnlyWorld, result: unknown, message: {
    messageId: string;
    deliveryCount: number;
}, orchestratorCallsBefore?: number): HeldMessage;
//# sourceMappingURL=orchestrator-harness.d.ts.map