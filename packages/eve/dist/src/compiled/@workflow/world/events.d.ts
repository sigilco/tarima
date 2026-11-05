import { z } from '#compiled/zod/index.js';
import type { Hook } from './hooks.js';
import type { StartedWorkflowRun, WorkflowRun } from './runs.js';
import type { EventsResolveData, PaginatedResponse, PaginationOptions, ResolveData } from './shared.js';
import type { StartedStep, Step } from './steps.js';
import type { Wait } from './waits.js';
export * from './event-metadata.js';
export declare const EventTypeSchema: z.ZodEnum<{
    run_created: "run_created";
    run_started: "run_started";
    run_completed: "run_completed";
    run_failed: "run_failed";
    run_cancelled: "run_cancelled";
    attr_set: "attr_set";
    step_created: "step_created";
    step_completed: "step_completed";
    step_failed: "step_failed";
    step_retrying: "step_retrying";
    step_started: "step_started";
    hook_created: "hook_created";
    hook_received: "hook_received";
    hook_disposed: "hook_disposed";
    hook_conflict: "hook_conflict";
    wait_created: "wait_created";
    wait_completed: "wait_completed";
    noop: "noop";
}>;
export type EventType = z.infer<typeof EventTypeSchema>;
declare const RunEventTypeSchema: z.ZodEnum<{
    run_created: "run_created";
    run_started: "run_started";
    run_completed: "run_completed";
    run_failed: "run_failed";
    run_cancelled: "run_cancelled";
}>;
export type RunEventType = z.infer<typeof RunEventTypeSchema>;
export declare const RUN_EVENT_TYPES: ("run_created" | "run_started" | "run_completed" | "run_failed" | "run_cancelled")[];
export declare function isRunEventType(eventType: string): eventType is RunEventType;
export declare const TerminalRunEventTypeSchema: z.ZodEnum<{
    run_completed: "run_completed";
    run_failed: "run_failed";
    run_cancelled: "run_cancelled";
}>;
export type TerminalRunEventType = z.infer<typeof TerminalRunEventTypeSchema>;
export declare const TERMINAL_RUN_EVENT_TYPES: ("run_completed" | "run_failed" | "run_cancelled")[];
export declare function isTerminalRunEventType(eventType: string): eventType is TerminalRunEventType;
declare const StepEventTypeSchema: z.ZodEnum<{
    step_created: "step_created";
    step_completed: "step_completed";
    step_failed: "step_failed";
    step_retrying: "step_retrying";
    step_started: "step_started";
}>;
export type StepEventType = z.infer<typeof StepEventTypeSchema>;
export declare const STEP_EVENT_TYPES: ("step_created" | "step_completed" | "step_failed" | "step_retrying" | "step_started")[];
export declare function isStepEventType(eventType: string): eventType is StepEventType;
declare const TerminalStepEventTypeSchema: z.ZodEnum<{
    step_completed: "step_completed";
    step_failed: "step_failed";
}>;
export type TerminalStepEventType = z.infer<typeof TerminalStepEventTypeSchema>;
export declare const TERMINAL_STEP_EVENT_TYPES: ("step_completed" | "step_failed")[];
export declare function isTerminalStepEventType(eventType: string): eventType is TerminalStepEventType;
declare const HookLifecycleEventTypeSchema: z.ZodEnum<{
    hook_created: "hook_created";
    hook_received: "hook_received";
    hook_disposed: "hook_disposed";
}>;
export type HookLifecycleEventType = z.infer<typeof HookLifecycleEventTypeSchema>;
export declare const HOOK_LIFECYCLE_EVENT_TYPES: ("hook_created" | "hook_received" | "hook_disposed")[];
export declare function isHookLifecycleEventType(eventType: string): eventType is HookLifecycleEventType;
declare const HookEventRequiringExistenceTypeSchema: z.ZodEnum<{
    hook_received: "hook_received";
    hook_disposed: "hook_disposed";
}>;
export type HookEventRequiringExistenceType = z.infer<typeof HookEventRequiringExistenceTypeSchema>;
export declare const HOOK_EVENTS_REQUIRING_EXISTENCE: ("hook_received" | "hook_disposed")[];
export declare function isHookEventRequiringExistence(eventType: string): eventType is HookEventRequiringExistenceType;
declare const WaitEventTypeSchema: z.ZodEnum<{
    wait_created: "wait_created";
    wait_completed: "wait_completed";
}>;
export type WaitEventType = z.infer<typeof WaitEventTypeSchema>;
export declare const WAIT_EVENT_TYPES: ("wait_created" | "wait_completed")[];
export declare function isWaitEventType(eventType: string): eventType is WaitEventType;
declare const ChildEntityCreationEventTypeSchema: z.ZodEnum<{
    step_created: "step_created";
    hook_created: "hook_created";
    wait_created: "wait_created";
}>;
export type ChildEntityCreationEventType = z.infer<typeof ChildEntityCreationEventTypeSchema>;
export declare const CHILD_ENTITY_CREATION_EVENT_TYPES: ("step_created" | "hook_created" | "wait_created")[];
export declare function isChildEntityCreationEventType(eventType: string): eventType is ChildEntityCreationEventType;
/**
 * Strip ref/payload fields from eventData based on resolveData setting.
 * When resolveData is 'none', removes only large data fields (refs) from
 * eventData while preserving metadata like stepName, workflowName, etc.
 */
export declare function stripEventDataRefs(event: Event, resolveData: EventsResolveData): Event;
export declare const BaseEventSchema: z.ZodObject<{
    eventType: z.ZodEnum<{
        run_created: "run_created";
        run_started: "run_started";
        run_completed: "run_completed";
        run_failed: "run_failed";
        run_cancelled: "run_cancelled";
        attr_set: "attr_set";
        step_created: "step_created";
        step_completed: "step_completed";
        step_failed: "step_failed";
        step_retrying: "step_retrying";
        step_started: "step_started";
        hook_created: "hook_created";
        hook_received: "hook_received";
        hook_disposed: "hook_disposed";
        hook_conflict: "hook_conflict";
        wait_created: "wait_created";
        wait_completed: "wait_completed";
        noop: "noop";
    }>;
    correlationId: z.ZodOptional<z.ZodString>;
    specVersion: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
/**
 * Event created when a hook is first invoked. The World implementation
 * atomically creates both the event and the hook entity.
 */
export declare const HookCreatedEventSchema: z.ZodObject<{
    specVersion: z.ZodOptional<z.ZodNumber>;
    eventType: z.ZodLiteral<"hook_created">;
    correlationId: z.ZodString;
    eventData: z.ZodObject<{
        token: z.ZodString;
        tokenRetentionUntil: z.ZodOptional<z.ZodCoercedDate<unknown>>;
        metadata: z.ZodOptional<z.ZodUnion<readonly [z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>, z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>]>>;
        isWebhook: z.ZodOptional<z.ZodBoolean>;
        isSystem: z.ZodOptional<z.ZodBoolean>;
        force: z.ZodOptional<z.ZodBoolean>;
        forceClaimedFrom: z.ZodOptional<z.ZodObject<{
            runId: z.ZodString;
            hookId: z.ZodString;
            workflowName: z.ZodOptional<z.ZodString>;
            deploymentId: z.ZodOptional<z.ZodString>;
            runSpecVersion: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
}, z.core.$strip>;
declare const HookReceivedEventSchema: z.ZodObject<{
    specVersion: z.ZodOptional<z.ZodNumber>;
    eventType: z.ZodLiteral<"hook_received">;
    correlationId: z.ZodString;
    eventData: z.ZodObject<{
        token: z.ZodOptional<z.ZodString>;
        payload: z.ZodUnion<readonly [z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>, z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>]>;
    }, z.core.$strip>;
}, z.core.$strip>;
/**
 * Event created by World implementations when a hook_created request
 * conflicts with an existing hook token. This event is NOT user-creatable -
 * it is only returned by the World when a token conflict is detected.
 *
 * When the hook consumer sees this event, it should reject any awaited
 * promises with a HookTokenConflictError.
 */
declare const HookConflictEventSchema: z.ZodObject<{
    specVersion: z.ZodOptional<z.ZodNumber>;
    eventType: z.ZodLiteral<"hook_conflict">;
    correlationId: z.ZodString;
    eventData: z.ZodObject<{
        token: z.ZodString;
        conflictingRunId: z.ZodOptional<z.ZodString>;
        forceRefusedReason: z.ZodOptional<z.ZodLiteral<"victim-spec-version">>;
    }, z.core.$strip>;
}, z.core.$strip>;
/**
 * Event created when a workflow run is first created. The World implementation
 * atomically creates both the event and the run entity with status 'pending'.
 */
declare const RunCreatedEventSchema: z.ZodObject<{
    correlationId: z.ZodOptional<z.ZodString>;
    specVersion: z.ZodOptional<z.ZodNumber>;
    eventType: z.ZodLiteral<"run_created">;
    eventData: z.ZodObject<{
        deploymentId: z.ZodString;
        workflowName: z.ZodString;
        input: z.ZodUnion<readonly [z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>, z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>]>;
        executionContext: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        allowReservedAttributes: z.ZodOptional<z.ZodLiteral<true>>;
        dynamicWorkflowCode: z.ZodOptional<z.ZodUnion<readonly [z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>, z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>]>>;
        dynamicWorkflowCodeRef: z.ZodOptional<z.ZodString>;
        encryptionPublicKey: z.ZodOptional<z.ZodString>;
        startHook: z.ZodOptional<z.ZodObject<{
            token: z.ZodString;
            hookId: z.ZodOptional<z.ZodString>;
            tokenRetentionUntil: z.ZodOptional<z.ZodCoercedDate<unknown>>;
            metadata: z.ZodOptional<z.ZodUnion<readonly [z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>, z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>]>>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const CreateEventSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    correlationId: z.ZodOptional<z.ZodString>;
    specVersion: z.ZodOptional<z.ZodNumber>;
    eventType: z.ZodLiteral<"run_created">;
    eventData: z.ZodObject<{
        deploymentId: z.ZodString;
        workflowName: z.ZodString;
        input: z.ZodUnion<readonly [z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>, z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>]>;
        executionContext: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        allowReservedAttributes: z.ZodOptional<z.ZodLiteral<true>>;
        dynamicWorkflowCode: z.ZodOptional<z.ZodUnion<readonly [z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>, z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>]>>;
        dynamicWorkflowCodeRef: z.ZodOptional<z.ZodString>;
        encryptionPublicKey: z.ZodOptional<z.ZodString>;
        startHook: z.ZodOptional<z.ZodObject<{
            token: z.ZodString;
            hookId: z.ZodOptional<z.ZodString>;
            tokenRetentionUntil: z.ZodOptional<z.ZodCoercedDate<unknown>>;
            metadata: z.ZodOptional<z.ZodUnion<readonly [z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>, z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>]>>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    correlationId: z.ZodOptional<z.ZodString>;
    specVersion: z.ZodOptional<z.ZodNumber>;
    eventType: z.ZodLiteral<"run_started">;
    eventData: z.ZodOptional<z.ZodObject<{
        input: z.ZodOptional<z.ZodUnion<readonly [z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>, z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>]>>;
        deploymentId: z.ZodOptional<z.ZodString>;
        workflowName: z.ZodOptional<z.ZodString>;
        executionContext: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        allowReservedAttributes: z.ZodOptional<z.ZodLiteral<true>>;
        encryptionPublicKey: z.ZodOptional<z.ZodString>;
        dynamicWorkflowCode: z.ZodOptional<z.ZodUnion<readonly [z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>, z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>]>>;
        dynamicWorkflowCodeRef: z.ZodOptional<z.ZodString>;
        startHook: z.ZodOptional<z.ZodObject<{
            token: z.ZodString;
            hookId: z.ZodOptional<z.ZodString>;
            tokenRetentionUntil: z.ZodOptional<z.ZodCoercedDate<unknown>>;
            metadata: z.ZodOptional<z.ZodUnion<readonly [z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>, z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>]>>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
}, z.core.$strip>, z.ZodObject<{
    correlationId: z.ZodOptional<z.ZodString>;
    specVersion: z.ZodOptional<z.ZodNumber>;
    eventType: z.ZodLiteral<"run_completed">;
    eventData: z.ZodObject<{
        output: z.ZodOptional<z.ZodUnion<readonly [z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>, z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>]>>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    correlationId: z.ZodOptional<z.ZodString>;
    specVersion: z.ZodOptional<z.ZodNumber>;
    eventType: z.ZodLiteral<"run_failed">;
    eventData: z.ZodObject<{
        error: z.ZodUnion<readonly [z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>, z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>]>;
        errorCode: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    correlationId: z.ZodOptional<z.ZodString>;
    specVersion: z.ZodOptional<z.ZodNumber>;
    eventType: z.ZodLiteral<"run_cancelled">;
    eventData: z.ZodOptional<z.ZodObject<{
        cancelReason: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>, z.ZodObject<{
    specVersion: z.ZodOptional<z.ZodNumber>;
    eventType: z.ZodLiteral<"attr_set">;
    correlationId: z.ZodOptional<z.ZodString>;
    eventData: z.ZodObject<{
        changes: z.ZodArray<z.ZodObject<{
            key: z.ZodString;
            value: z.ZodNullable<z.ZodString>;
        }, z.core.$strip>>;
        writer: z.ZodDiscriminatedUnion<[z.ZodObject<{
            type: z.ZodLiteral<"workflow">;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"step">;
            stepId: z.ZodString;
            attempt: z.ZodNumber;
        }, z.core.$strip>], "type">;
        allowReservedAttributes: z.ZodOptional<z.ZodLiteral<true>>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    specVersion: z.ZodOptional<z.ZodNumber>;
    eventType: z.ZodLiteral<"step_created">;
    correlationId: z.ZodString;
    eventData: z.ZodObject<{
        stepName: z.ZodString;
        workflowName: z.ZodOptional<z.ZodString>;
        input: z.ZodUnion<readonly [z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>, z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>]>;
        inline: z.ZodOptional<z.ZodBoolean>;
        creatorMessageId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    specVersion: z.ZodOptional<z.ZodNumber>;
    eventType: z.ZodLiteral<"step_completed">;
    correlationId: z.ZodString;
    eventData: z.ZodObject<{
        ttfs: z.ZodOptional<z.ZodNumber>;
        stso: z.ZodOptional<z.ZodNumber>;
        stepCount: z.ZodOptional<z.ZodNumber>;
        eventCount: z.ZodOptional<z.ZodNumber>;
        rsfs: z.ZodOptional<z.ZodNumber>;
        finalSchedulingReplay: z.ZodOptional<z.ZodNumber>;
        optimizations: z.ZodOptional<z.ZodArray<z.ZodString>>;
        stepName: z.ZodOptional<z.ZodString>;
        workflowName: z.ZodOptional<z.ZodString>;
        result: z.ZodUnion<readonly [z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>, z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>]>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    specVersion: z.ZodOptional<z.ZodNumber>;
    eventType: z.ZodLiteral<"step_failed">;
    correlationId: z.ZodString;
    eventData: z.ZodObject<{
        ttfs: z.ZodOptional<z.ZodNumber>;
        stso: z.ZodOptional<z.ZodNumber>;
        stepCount: z.ZodOptional<z.ZodNumber>;
        eventCount: z.ZodOptional<z.ZodNumber>;
        rsfs: z.ZodOptional<z.ZodNumber>;
        finalSchedulingReplay: z.ZodOptional<z.ZodNumber>;
        optimizations: z.ZodOptional<z.ZodArray<z.ZodString>>;
        stepName: z.ZodOptional<z.ZodString>;
        error: z.ZodUnion<readonly [z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>, z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>]>;
        attempt: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    specVersion: z.ZodOptional<z.ZodNumber>;
    eventType: z.ZodLiteral<"step_retrying">;
    correlationId: z.ZodString;
    eventData: z.ZodObject<{
        stepName: z.ZodOptional<z.ZodString>;
        error: z.ZodUnion<readonly [z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>, z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>]>;
        retryAfter: z.ZodOptional<z.ZodCoercedDate<unknown>>;
        attempt: z.ZodOptional<z.ZodNumber>;
        creatorMessageId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    specVersion: z.ZodOptional<z.ZodNumber>;
    eventType: z.ZodLiteral<"step_started">;
    correlationId: z.ZodString;
    eventData: z.ZodOptional<z.ZodObject<{
        stepName: z.ZodOptional<z.ZodString>;
        attempt: z.ZodOptional<z.ZodNumber>;
        workflowName: z.ZodOptional<z.ZodString>;
        input: z.ZodOptional<z.ZodUnion<readonly [z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>, z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>]>>;
        inline: z.ZodOptional<z.ZodBoolean>;
        ownerMessageId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>, z.ZodObject<{
    specVersion: z.ZodOptional<z.ZodNumber>;
    eventType: z.ZodLiteral<"hook_created">;
    correlationId: z.ZodString;
    eventData: z.ZodObject<{
        token: z.ZodString;
        tokenRetentionUntil: z.ZodOptional<z.ZodCoercedDate<unknown>>;
        metadata: z.ZodOptional<z.ZodUnion<readonly [z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>, z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>]>>;
        isWebhook: z.ZodOptional<z.ZodBoolean>;
        isSystem: z.ZodOptional<z.ZodBoolean>;
        force: z.ZodOptional<z.ZodBoolean>;
        forceClaimedFrom: z.ZodOptional<z.ZodObject<{
            runId: z.ZodString;
            hookId: z.ZodString;
            workflowName: z.ZodOptional<z.ZodString>;
            deploymentId: z.ZodOptional<z.ZodString>;
            runSpecVersion: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    specVersion: z.ZodOptional<z.ZodNumber>;
    eventType: z.ZodLiteral<"hook_received">;
    correlationId: z.ZodString;
    eventData: z.ZodObject<{
        token: z.ZodOptional<z.ZodString>;
        payload: z.ZodUnion<readonly [z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>, z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>]>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    specVersion: z.ZodOptional<z.ZodNumber>;
    eventType: z.ZodLiteral<"hook_disposed">;
    correlationId: z.ZodString;
    eventData: z.ZodOptional<z.ZodObject<{
        token: z.ZodOptional<z.ZodString>;
        forceClaimedBy: z.ZodOptional<z.ZodObject<{
            runId: z.ZodString;
            hookId: z.ZodString;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
}, z.core.$strip>, z.ZodObject<{
    specVersion: z.ZodOptional<z.ZodNumber>;
    eventType: z.ZodLiteral<"wait_created">;
    correlationId: z.ZodString;
    eventData: z.ZodObject<{
        resumeAt: z.ZodCoercedDate<unknown>;
        creatorMessageId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    specVersion: z.ZodOptional<z.ZodNumber>;
    eventType: z.ZodLiteral<"wait_completed">;
    correlationId: z.ZodString;
    eventData: z.ZodOptional<z.ZodObject<{
        resumeAt: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    }, z.core.$strip>>;
}, z.core.$strip>], "eventType">;
export declare const EventSchema: z.ZodIntersection<z.ZodDiscriminatedUnion<[z.ZodObject<{
    correlationId: z.ZodOptional<z.ZodString>;
    specVersion: z.ZodOptional<z.ZodNumber>;
    eventType: z.ZodLiteral<"run_created">;
    eventData: z.ZodObject<{
        deploymentId: z.ZodString;
        workflowName: z.ZodString;
        input: z.ZodUnion<readonly [z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>, z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>]>;
        executionContext: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        allowReservedAttributes: z.ZodOptional<z.ZodLiteral<true>>;
        dynamicWorkflowCode: z.ZodOptional<z.ZodUnion<readonly [z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>, z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>]>>;
        dynamicWorkflowCodeRef: z.ZodOptional<z.ZodString>;
        encryptionPublicKey: z.ZodOptional<z.ZodString>;
        startHook: z.ZodOptional<z.ZodObject<{
            token: z.ZodString;
            hookId: z.ZodOptional<z.ZodString>;
            tokenRetentionUntil: z.ZodOptional<z.ZodCoercedDate<unknown>>;
            metadata: z.ZodOptional<z.ZodUnion<readonly [z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>, z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>]>>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    correlationId: z.ZodOptional<z.ZodString>;
    specVersion: z.ZodOptional<z.ZodNumber>;
    eventType: z.ZodLiteral<"run_started">;
    eventData: z.ZodOptional<z.ZodObject<{
        input: z.ZodOptional<z.ZodUnion<readonly [z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>, z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>]>>;
        deploymentId: z.ZodOptional<z.ZodString>;
        workflowName: z.ZodOptional<z.ZodString>;
        executionContext: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        allowReservedAttributes: z.ZodOptional<z.ZodLiteral<true>>;
        encryptionPublicKey: z.ZodOptional<z.ZodString>;
        dynamicWorkflowCode: z.ZodOptional<z.ZodUnion<readonly [z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>, z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>]>>;
        dynamicWorkflowCodeRef: z.ZodOptional<z.ZodString>;
        startHook: z.ZodOptional<z.ZodObject<{
            token: z.ZodString;
            hookId: z.ZodOptional<z.ZodString>;
            tokenRetentionUntil: z.ZodOptional<z.ZodCoercedDate<unknown>>;
            metadata: z.ZodOptional<z.ZodUnion<readonly [z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>, z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>]>>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
}, z.core.$strip>, z.ZodObject<{
    correlationId: z.ZodOptional<z.ZodString>;
    specVersion: z.ZodOptional<z.ZodNumber>;
    eventType: z.ZodLiteral<"run_completed">;
    eventData: z.ZodObject<{
        output: z.ZodOptional<z.ZodUnion<readonly [z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>, z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>]>>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    correlationId: z.ZodOptional<z.ZodString>;
    specVersion: z.ZodOptional<z.ZodNumber>;
    eventType: z.ZodLiteral<"run_failed">;
    eventData: z.ZodObject<{
        error: z.ZodUnion<readonly [z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>, z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>]>;
        errorCode: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    correlationId: z.ZodOptional<z.ZodString>;
    specVersion: z.ZodOptional<z.ZodNumber>;
    eventType: z.ZodLiteral<"run_cancelled">;
    eventData: z.ZodOptional<z.ZodObject<{
        cancelReason: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>, z.ZodObject<{
    specVersion: z.ZodOptional<z.ZodNumber>;
    eventType: z.ZodLiteral<"attr_set">;
    correlationId: z.ZodOptional<z.ZodString>;
    eventData: z.ZodObject<{
        changes: z.ZodArray<z.ZodObject<{
            key: z.ZodString;
            value: z.ZodNullable<z.ZodString>;
        }, z.core.$strip>>;
        writer: z.ZodDiscriminatedUnion<[z.ZodObject<{
            type: z.ZodLiteral<"workflow">;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"step">;
            stepId: z.ZodString;
            attempt: z.ZodNumber;
        }, z.core.$strip>], "type">;
        allowReservedAttributes: z.ZodOptional<z.ZodLiteral<true>>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    specVersion: z.ZodOptional<z.ZodNumber>;
    eventType: z.ZodLiteral<"step_created">;
    correlationId: z.ZodString;
    eventData: z.ZodObject<{
        stepName: z.ZodString;
        workflowName: z.ZodOptional<z.ZodString>;
        input: z.ZodUnion<readonly [z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>, z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>]>;
        inline: z.ZodOptional<z.ZodBoolean>;
        creatorMessageId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    specVersion: z.ZodOptional<z.ZodNumber>;
    eventType: z.ZodLiteral<"step_completed">;
    correlationId: z.ZodString;
    eventData: z.ZodObject<{
        ttfs: z.ZodOptional<z.ZodNumber>;
        stso: z.ZodOptional<z.ZodNumber>;
        stepCount: z.ZodOptional<z.ZodNumber>;
        eventCount: z.ZodOptional<z.ZodNumber>;
        rsfs: z.ZodOptional<z.ZodNumber>;
        finalSchedulingReplay: z.ZodOptional<z.ZodNumber>;
        optimizations: z.ZodOptional<z.ZodArray<z.ZodString>>;
        stepName: z.ZodOptional<z.ZodString>;
        workflowName: z.ZodOptional<z.ZodString>;
        result: z.ZodUnion<readonly [z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>, z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>]>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    specVersion: z.ZodOptional<z.ZodNumber>;
    eventType: z.ZodLiteral<"step_failed">;
    correlationId: z.ZodString;
    eventData: z.ZodObject<{
        ttfs: z.ZodOptional<z.ZodNumber>;
        stso: z.ZodOptional<z.ZodNumber>;
        stepCount: z.ZodOptional<z.ZodNumber>;
        eventCount: z.ZodOptional<z.ZodNumber>;
        rsfs: z.ZodOptional<z.ZodNumber>;
        finalSchedulingReplay: z.ZodOptional<z.ZodNumber>;
        optimizations: z.ZodOptional<z.ZodArray<z.ZodString>>;
        stepName: z.ZodOptional<z.ZodString>;
        error: z.ZodUnion<readonly [z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>, z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>]>;
        attempt: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    specVersion: z.ZodOptional<z.ZodNumber>;
    eventType: z.ZodLiteral<"step_retrying">;
    correlationId: z.ZodString;
    eventData: z.ZodObject<{
        stepName: z.ZodOptional<z.ZodString>;
        error: z.ZodUnion<readonly [z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>, z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>]>;
        retryAfter: z.ZodOptional<z.ZodCoercedDate<unknown>>;
        attempt: z.ZodOptional<z.ZodNumber>;
        creatorMessageId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    specVersion: z.ZodOptional<z.ZodNumber>;
    eventType: z.ZodLiteral<"step_started">;
    correlationId: z.ZodString;
    eventData: z.ZodOptional<z.ZodObject<{
        stepName: z.ZodOptional<z.ZodString>;
        attempt: z.ZodOptional<z.ZodNumber>;
        workflowName: z.ZodOptional<z.ZodString>;
        input: z.ZodOptional<z.ZodUnion<readonly [z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>, z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>]>>;
        inline: z.ZodOptional<z.ZodBoolean>;
        ownerMessageId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>, z.ZodObject<{
    specVersion: z.ZodOptional<z.ZodNumber>;
    eventType: z.ZodLiteral<"hook_created">;
    correlationId: z.ZodString;
    eventData: z.ZodObject<{
        token: z.ZodString;
        tokenRetentionUntil: z.ZodOptional<z.ZodCoercedDate<unknown>>;
        metadata: z.ZodOptional<z.ZodUnion<readonly [z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>, z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>]>>;
        isWebhook: z.ZodOptional<z.ZodBoolean>;
        isSystem: z.ZodOptional<z.ZodBoolean>;
        force: z.ZodOptional<z.ZodBoolean>;
        forceClaimedFrom: z.ZodOptional<z.ZodObject<{
            runId: z.ZodString;
            hookId: z.ZodString;
            workflowName: z.ZodOptional<z.ZodString>;
            deploymentId: z.ZodOptional<z.ZodString>;
            runSpecVersion: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    specVersion: z.ZodOptional<z.ZodNumber>;
    eventType: z.ZodLiteral<"hook_received">;
    correlationId: z.ZodString;
    eventData: z.ZodObject<{
        token: z.ZodOptional<z.ZodString>;
        payload: z.ZodUnion<readonly [z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>, z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>]>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    specVersion: z.ZodOptional<z.ZodNumber>;
    eventType: z.ZodLiteral<"hook_disposed">;
    correlationId: z.ZodString;
    eventData: z.ZodOptional<z.ZodObject<{
        token: z.ZodOptional<z.ZodString>;
        forceClaimedBy: z.ZodOptional<z.ZodObject<{
            runId: z.ZodString;
            hookId: z.ZodString;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
}, z.core.$strip>, z.ZodObject<{
    specVersion: z.ZodOptional<z.ZodNumber>;
    eventType: z.ZodLiteral<"hook_conflict">;
    correlationId: z.ZodString;
    eventData: z.ZodObject<{
        token: z.ZodString;
        conflictingRunId: z.ZodOptional<z.ZodString>;
        forceRefusedReason: z.ZodOptional<z.ZodLiteral<"victim-spec-version">>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    specVersion: z.ZodOptional<z.ZodNumber>;
    eventType: z.ZodLiteral<"wait_created">;
    correlationId: z.ZodString;
    eventData: z.ZodObject<{
        resumeAt: z.ZodCoercedDate<unknown>;
        creatorMessageId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    specVersion: z.ZodOptional<z.ZodNumber>;
    eventType: z.ZodLiteral<"wait_completed">;
    correlationId: z.ZodString;
    eventData: z.ZodOptional<z.ZodObject<{
        resumeAt: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    }, z.core.$strip>>;
}, z.core.$strip>, z.ZodObject<{
    correlationId: z.ZodOptional<z.ZodString>;
    specVersion: z.ZodOptional<z.ZodNumber>;
    eventType: z.ZodLiteral<"noop">;
    eventData: z.ZodOptional<z.ZodObject<{
        sealed: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$loose>>;
}, z.core.$strip>], "eventType">, z.ZodObject<{
    runId: z.ZodString;
    eventId: z.ZodString;
    createdAt: z.ZodCoercedDate<unknown>;
    occurredAt: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    specVersion: z.ZodOptional<z.ZodNumber>;
    resumeId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
export type Event = z.infer<typeof EventSchema>;
export type EventOfType<T extends EventType> = Extract<Event, {
    eventType: T;
}>;
export type EventRequestOfType<T extends EventType> = Extract<AnyEventRequest, {
    eventType: T;
}>;
export type HookCreatedEvent = EventOfType<'hook_created'>;
export type HookCreatedEventRequest = EventRequestOfType<'hook_created'>;
export type HookReceivedEvent = z.infer<typeof HookReceivedEventSchema>;
export type HookConflictEvent = z.infer<typeof HookConflictEventSchema>;
/**
 * Union of all possible event request types.
 * @internal Use CreateEventRequest or RunCreatedEventRequest instead.
 */
export type AnyEventRequest = z.infer<typeof CreateEventSchema>;
type ChildEntityCreationEventRequest = EventRequestOfType<ChildEntityCreationEventType> | (EventRequestOfType<'step_started'> & {
    eventData: {
        stepName: string;
        input: unknown;
    };
});
/** Includes lazy step_started requests that create their step on demand. */
export declare function isChildEntityCreationEvent(event: AnyEventRequest): event is ChildEntityCreationEventRequest;
/**
 * Event request for creating a new workflow run.
 * Can be used with a client-generated runId or null for server-generated.
 */
export type RunCreatedEventRequest = z.infer<typeof RunCreatedEventSchema>;
/**
 * Event request types that require an existing runId.
 * This is the common case for all events except run_created.
 */
export type CreateEventRequest = Exclude<AnyEventRequest, RunCreatedEventRequest>;
export interface CreateEventParams {
    v1Compat?: boolean;
    /**
     * Whether the run's orchestrator is making this write (spec >= 9).
     *
     * In-band writes are everything the orchestrator invocation writes:
     * `run_started`, `run_completed`, `run_failed`, `step_created`,
     * `wait_created`, `wait_completed`, `hook_created`, `hook_disposed`, an
     * `attr_set` from the workflow body, a `hook_received` it writes for a
     * resume carried on its own queue message, and every event of a step it
     * runs inline. Out-of-band writes are everything else: events from a
     * background step's invocation, `hook_received` from `resumeHook()` and
     * webhooks, `run_cancelled` from `cancel()`, and `attr_set` from
     * `setAttributes()` outside the workflow body. Classification is by writer,
     * not by event type.
     *
     * A World that creates spec 9 runs implements the in-band fence
     * (`WorldCapabilities.inBandFence`): it counts the positions it allocates to
     * in-band writes, and accepts an in-band write only when
     * {@link expectedSeqInBand} equals that count.
     */
    inBand?: boolean;
    /**
     * The orchestrator's count of in-band positions, required with
     * `inBand: true` (a World answers an in-band write without it with a 400).
     * The runtime starts
     * it from {@link EventListResponse.snapshot}`.seqInBand` of the first page
     * of the delivery's full log load, and advances it by the number of
     * positions each accepted in-band write allocated (1 for a single create,
     * the event count for a batch).
     *
     * The World refuses a write whose value differs from its count with
     * `InBandSupersededError`, and writes and allocates nothing for it, so a
     * refusal never leaves a hole in the log.
     */
    expectedSeqInBand?: number;
    /**
     * `'skip-step-inputs'` applies only to the event-log page this create
     * returns (the `sinceCursor` delta or a replay preload), never to the
     * created `event` or the returned `step` entity, whose `input` is what step
     * execution reads. See {@link EventsResolveData}.
     *
     * Code that forwards these params to an entity read (runs, steps, hooks,
     * whose `resolveData` is a plain {@link ResolveData}) must map them with
     * `entityResolveData()` first.
     */
    resolveData?: EventsResolveData;
    /**
     * Lazy hook resume idempotency key. Set only by `resumeHook()` when it
     * persists a `hook_received` event whose creation must be deduplicated
     * against a concurrent re-ensure from the queue consumer. The World routes
     * it to the backend's `(runId, resumeId)` constraint so both writers
     * converge on exactly one event. Only meaningful for `hook_received`.
     */
    resumeId?: string;
    /**
     * Content digest of the serialized resume payload, computed once by
     * `resumeHook()` and forwarded identically on the direct write and the queue
     * re-ensure. The World routes it to the backend so both writers record the
     * same digest on the `(runId, resumeId)` constraint. Only meaningful
     * alongside {@link resumeId}.
     */
    resumePayloadDigest?: string;
    /** Require the server's deduplicated resolved-hook endpoint. Unsupported
     * backends must reject before writing rather than silently dropping dedup. */
    requireHookResumeDedup?: boolean;
    /**
     * Marks a `step_created` create as the queue consumer's re-ensure of a
     * resilient step dispatch (a step message carrying `stepInput`, see
     * `WorkflowInvokePayload.stepInput`): the producer's direct write was
     * parallelized with the queue publish and may have failed. Only meaningful
     * for `step_created`.
     *
     * Advisory, and not set by the current `@workflow/core` runtime, which
     * publishes a step's queue message only after its create. A producer that
     * parallelizes the two accepts that a create can come back refused while
     * the message carrying its payload is already out, and a backend MAY use
     * this flag to narrow that window: refuse the re-ensure (world-vercel surfaces the
     * backend's 410 as `RunExpiredError`, which the consumer treats as "nothing
     * left to execute" and acks the message) when it has recorded a refusal for
     * this correlation id and no step entity exists. Best-effort by nature (a
     * marker written at refusal time cannot be ordered before the redelivery it
     * is meant to stop), so it hardens, and does not close, the window. Worlds
     * may ignore this flag entirely.
     */
    viaStepDispatch?: boolean;
    /**
     * Marks a `step_failed` write that records the failure of a step body this
     * invocation already ran. Losing such a write to queue redelivery runs the
     * body again, so a World may keep a throttled write waiting longer than it
     * otherwise would (world-vercel waits until the invocation's deadline).
     * `step_failed` needs the mark because the runtime also writes it for a step
     * whose arguments failed to serialize, where no body ran. `step_completed`
     * and `step_retrying` are only ever written after a body ran. Advisory;
     * Worlds may ignore it.
     */
    afterStepBody?: true;
    /** Request ID (x-vercel-id when on Vercel) for correlating request logs with workflow events. */
    requestId?: string;
    /**
     * Compute instance whose handler is writing this event (`COMPUTE_INSTANCE_ID`
     * in @workflow/core). Ambient per-event identity like {@link requestId},
     * which distinguishes invocations *within* an instance. Read back via
     * `AnalyticsEventSchema` / `AnalyticsStepSchema`.
     */
    computeInstanceId?: string;
    /**
     * Creation time of the step a `step_started` starts, as epoch milliseconds:
     * the `createdAt` the World answered that step's `step_created` with. Set
     * only on the first-attempt `step_started` of a background step (one
     * created by `step_created`, and started by its own queue message), so a
     * World can report the step's creation-to-start latency without reading
     * the log. Request telemetry, not workflow state: Worlds may ignore it and
     * must not persist it into the event log.
     */
    stepCreatedAt?: number;
    /**
     * How many events the writer held in its loaded log when it decided to write
     * this one: equivalently, the slot it expects to land on minus one. Sent by
     * the replay loop and the suspension handler, which merge the report below
     * back into their loaded log. Omitted by callers with no loaded log to be
     * stale against, the step executor included: for those the report would be
     * a read the World does for no one. Independent concurrent hook registrations
     * in a hooks-only suspension also omit it deliberately: the runtime verifies
     * their committed events together after every write settles, and reloads if
     * they do not form a complete suffix. Absence does not imply no loaded log;
     * without a count there is no evidence for count-based stale rejection.
     *
     * A World's slots are dense and 1-based (see `Storage.events`), so a count
     * and a position are the same number. An id that is not a position does not
     * produce a count here: it throws, since the runtime cannot state a
     * snapshot for a log it cannot place. Such a World attempts
     * `eventCount + 1`, and on contention **bumps** to the next free slot and
     * commits there anyway: a stale count never rejects a write. What it does
     * instead is report: when the committed slot is higher than the one asked
     * for, the events occupying the skipped slots come back on the success
     * response in {@link EventResult.events} / `cursor` / `hasMore`, so the
     * writer learns exactly what it had not seen.
     *
     * Understating is safe and overstating is not. A count below the writer's
     * true position only widens the reported span, and the client discards what
     * its log already holds. A count above it makes the World report less than
     * the writer is missing, which is a hole the writer never learns about.
     *
     * A batch of writes issued from one snapshot starts from the same
     * `eventCount`; they land on consecutive slots in whatever order the World
     * serializes them, which is why they can stay a parallel fan-out instead of
     * a chain of round-trips. The count a given write sends is the writer's
     * position *at that moment*, so it advances mid-batch as reported events are
     * folded back into the loaded log: a write issued after a sibling's
     * bump-and-report already holds the slots that report named, and asks for a
     * slot above them.
     *
     * For an in-band write on a spec >= 9 run the report is authoritative: the
     * success response carries every event in positions `eventCount + 1` up to
     * (not including) the write's own first position, in position order, each
     * committed or sealed. When the World cannot produce all of it within its
     * request budget it still answers success, with `hasMore: true`
     * ({@link EventResult}). The orchestrator consumes an
     * event it wrote that resolves a promise only after merging this report,
     * so the VM consumes events in log order. Out-of-band writes get no report.
     */
    eventCount?: number;
    /**
     * Timestamp for when the event occurred on the client side. Worlds that
     * support this can persist it separately from `createdAt`, which represents
     * when the backing service accepted or stored the event.
     */
    occurredAt?: Date;
    /**
     * Number of consecutive replay divergences resolved by this event write.
     *
     * This is request telemetry, not workflow state. Worlds may use it for
     * metrics and diagnostics, but must not require it for event
     * materialization or persist it into the event log.
     */
    replayDivergenceCount?: number;
    /**
     * Inline-delta optimization (opt-in). When set, the World MAY return,
     * on the resulting {@link EventResult}, the first page of events written
     * strictly after this cursor (via `events`/`cursor`/`hasMore`): the
     * same page an `events.list({ cursor: sinceCursor, sortOrder: 'asc' })`
     * call would return immediately after this write. Outside turbo mode the
     * runtime sets this on every write it makes from the orchestrator loop
     * and folds any returned delta into its in-memory log, so each write
     * carries the log forward and the loop reads it back for free: instead of
     * re-reading its own just-written events (and any events interleaved
     * in-band, such as `hook_received`), it consumes the authoritative delta
     * the write already had to compute. Turbo mode does not set it: the
     * point there is to keep the first invocation's writes as cheap as
     * possible, and it has no loaded log to extend.
     *
     * The suspension handler sets it too, on the hook create of a single-hook
     * suspension. That write is the whole continuation for the hook's own
     * awaiter — the event it commits is what settles it — so a delta lets the
     * runtime advance the workflow in the same process instead of enqueueing a
     * message whose only job is to read back the event it just wrote. It is
     * asked for on one hook create per suspension because two creates issued
     * from the same cursor each diff against it, and only one of the returned
     * deltas can be folded into the log.
     *
     * A World that answers it on `hook_created` MUST answer it on the
     * `hook_conflict` a create whose token is already claimed commits instead.
     * That event settles the same awaiter — a payload await rejects, a
     * `hook.getConflict()` resolves with the conflicting run — and the runtime
     * continues over it in-process just the same, so withholding the delta
     * there would silently cost a delivery on exactly the path the caller
     * asked to avoid one on. The delta is keyed on the requested event type,
     * not the committed one; there is nothing extra to compute, since it is the
     * same slice of the log either way.
     *
     * The cursor MUST share `events.list` semantics: the returned `events`
     * are everything sorted strictly after `sinceCursor`, `cursor` is the
     * position past the last returned event, and `hasMore` indicates a
     * further page exists. A World MAY return a single page and set
     * `hasMore: true` rather than paginating to exhaustion. The runtime
     * consumes that page and continues from its cursor, so it never reads the
     * returned prefix again.
     * Returning these fields at all is OPTIONAL: a World that omits them is
     * fully supported; the runtime falls back to `events.list`. This
     * preserves the same divergence guarantees as the fetch path because the
     * delta is computed atomically against the same log the fetch would read.
     */
    sinceCursor?: string;
    /**
     * Run-started preload opt-out (advisory). On a `run_started` write a World
     * MAY preload the run's event log onto the {@link EventResult}
     * (`events`/`cursor`/`hasMore`) so the runtime can skip its initial
     * `events.list`. The turbo first invocation backgrounds `run_started`
     * purely as a write barrier and never reads that preload, so it sets this
     * to tell the World to skip the wasted list+resolve, trimming the
     * `run_started` round-trip that the chained first `step_started` waits on.
     * A World that ignores it (or doesn't preload) remains fully correct: the
     * runtime falls back to `events.list` whenever it actually needs the log.
     * Only honored for `run_started`; ignored for other event types.
     *
     * Named to match the World boundary, the wire frame meta, and the backend
     * option end-to-end (cf. {@link sinceCursor}) so the single name greps
     * across the SDK and the backend.
     */
    skipPreload?: true;
    /**
     * Replay-log preload opt-in (advisory): the `hook_received` dual of
     * {@link skipPreload}. Set only by the queue consumer's idempotent
     * `hook_received` re-ensure on a lazy hook resume (alongside
     * {@link resumeId} + {@link resumePayloadDigest}). A World MAY return the
     * run's current replay event log with the event creation
     * (`events`/`cursor`/`hasMore`, plus `run` and `maxEvents`) so the runtime
     * can initialize replay from this one request and skip both the
     * `run_started` write and the initial `events.list`.
     *
     * The runtime trusts a returned preload as replay input ONLY when all of
     * the following hold (a World that cannot guarantee them should return
     * its normal {@link EventResult} instead):
     *
     * - `events` is the COMPLETE log with `hasMore: false` (the runtime has no
     *   cursor-continuation machinery on this path; a bounded page is
     *   rejected).
     * - `cursor` is a valid non-null resume point matching `events.list`
     *   semantics (present even on the final page).
     * - `run` (with `run.startedAt`) and `maxEvents` are present: this
     *   response plays `run_started`'s role, including the event-ceiling
     *   handshake.
     * - The log contains `run_created`, `run_started`, and the canonical
     *   `hook_received` carrying the requested {@link resumeId}.
     * - `events` uses the same ascending ordering semantics as `events.list`.
     * - The log is read atomically/consistently WITH (i.e. no earlier than)
     *   the `hook_received` write, so no concurrently committed event can be
     *   omitted from the replay input.
     *
     * Anything less and the runtime observes that no usable replay preload
     * came back and falls back to the existing `run_started` setup. A World
     * that ignores the param entirely remains fully correct. Only meaningful
     * for `hook_received`; ignored for other event types. Producer-side
     * `resumeHook()` must not set it.
     */
    preloadEvents?: true;
    /**
     * Synchronously observes each validated event in a streamed replay-log
     * response. A retried request may observe the same event again; observers
     * must therefore be idempotent. Throwing aborts the operation and the World
     * must surface the original error without retrying or reclassifying it.
     */
    replayEventObserver?: (event: Event) => void;
}
/**
 * Result of creating an event. Includes the created event and optionally
 * the entity that was created or updated as a result of the event, with any updates applied to it.
 *
 * Note: `event` is optional to support legacy runs where event storage is skipped.
 */
export type EventResult<T extends EventType = EventType> = {
    /** The created event (optional for legacy compatibility) */
    event?: Event;
    /**
     * Optional ascending events.list cursor immediately after `event`, minted
     * by the World that owns the cursor format. This does not attest that the
     * caller holds any earlier events. The runtime may advance to it only after
     * proving that its loaded prefix plus committed responses covers every slot
     * through this event. Worlds that omit it retain the normal reload path.
     * When supplied, `event` MUST match what ascending events.list returns for
     * that slot with the same resolveData option, including stored timestamps,
     * normalized retention, metadata bytes, and hook-conflict details. The
     * runtime uses this stored event as replay input, not an echo of the request.
     */
    eventCursor?: string;
    /** The workflow run entity (for run_* events) */
    run?: WorkflowRun;
    /** The step entity (for step_* events) */
    step?: Step;
    /** The hook entity (for hook_created events) */
    hook?: Hook;
    /** The wait entity (for wait_created/wait_completed events) */
    wait?: Wait;
    /**
     * Lazy step start: set to `true` only when a `step_started` event with
     * step-creation data atomically *created* the step on this call (the
     * caller won the create-claim), as opposed to transitioning a step that
     * already existed. The owned-inline runtime path uses this as the
     * exactly-once ownership signal: it runs the step body inline only when
     * it created the step, so a concurrent handler that lost the create race
     * (and gets `EntityConflictError`/skipped) never double-executes. Absent
     * (undefined) on the legacy path and from older servers/worlds, which is
     * the safe default (treated as "not the lazy creator").
     */
    stepCreated?: true;
    /** Server-owned max event count for the run (run-lifecycle responses); the runtime enforces it. */
    maxEvents?: number;
    /**
     * How many positions this write allocated (spec >= 9):
     * 1 for a create that appended its event, 0 for one that converged on an
     * event the log already held (an idempotent replay). The orchestrator
     * advances its in-band count by this number. Absent from a World that
     * does not report it; the runtime then infers it.
     */
    allocated?: number;
} & ({
    /**
     * Events with data resolved. Five producers populate this:
     *
     * - On a `run_started` response: all events up to this point, so the
     *   runtime can skip the initial `events.list` call and reduce TTFB.
     * - On a step-terminal write (`step_completed` / `step_failed`) when
     *   the caller passed {@link CreateEventParams.sinceCursor}: the delta
     *   of events written strictly after that cursor, so the inline loop
     *   can skip the per-step incremental `events.list` round-trip.
     * - On a hook-create write when the caller passed
     *   {@link CreateEventParams.sinceCursor}: the same delta, which
     *   includes the event the create committed — the `hook_created`, or
     *   the `hook_conflict` of an already-claimed token — so the hook's
     *   awaiter can be settled in the writing process rather than by a
     *   re-invocation that reads the event back.
     * - On a `hook_received` response when the caller passed
     *   {@link CreateEventParams.preloadEvents}: the run's current replay
     *   log through the canonical `hook_received`, so the lazy hook queue
     *   consumer can skip both the `run_started` write and the initial
     *   `events.list`.
     * - On any response whose committed slot came out higher than the one
     *   {@link CreateEventParams.eventCount} asked for:
     *   the events occupying the slots that were skipped over, in slot
     *   order. This is the "report" half of bump-and-report: the write
     *   succeeded, and these are the events the writer had not seen when it
     *   decided to make it.
     */
    events: Event[];
    /** Pagination cursor for `events`, matching events.list semantics. */
    cursor: string | null;
    /**
     * Whether additional event pages are available for `events`. On an
     * in-band write's response (spec >= 9), `true` also means the World
     * could not produce the complete skipped-slot report within its
     * request budget: the write committed, and the writer must reload the
     * log before it consumes anything the write resolves, since the report
     * may be missing events that sit below its own.
     */
    hasMore: boolean;
} | {
    events?: undefined;
    cursor?: undefined;
    hasMore?: undefined;
}) & (T extends 'run_created' ? {
    run: WorkflowRun;
} : T extends 'run_started' ? {
    run: StartedWorkflowRun;
} : T extends 'step_started' ? {
    /**
     * The started step, on a run that keeps step entities (spec 8 and
     * below). A single-orchestrator run (spec >= 9) keeps none, so
     * its start returns no step.
     */
    step?: StartedStep;
} : unknown);
/**
 * One event of a batch write ({@link Storage.events.createBatch}), in request
 * order, which is the order the events land in the run's log.
 */
export interface BatchEventRequest {
    /** The event, same discriminated union the single `create` takes. */
    event: CreateEventRequest;
    /**
     * Client event time for this event. Under slot identity this is the source
     * of the durable event's `createdAt` (a slot id carries no time), so the
     * timestamp a replay observes is the one the writer chose: set it to the
     * instant the event logically occurred.
     */
    occurredAt?: Date;
    /**
     * Compute-instance attribution for this event, same as the single create's
     * {@link CreateEventParams.computeInstanceId}. Set on the `step_started`
     * half of a pre-claimed inline pair so a batched claim attributes the
     * executing instance exactly like the lazy claim it replaces.
     */
    computeInstanceId?: string;
    /**
     * Step creation time for a `step_started`, same as the single create's
     * {@link CreateEventParams.stepCreatedAt}.
     */
    stepCreatedAt?: number;
}
/** Per-batch parameters for {@link Storage.events.createBatch}. */
export interface CreateEventBatchParams {
    resolveData?: ResolveData;
    /**
     * Request id for per-write attribution, same as the single create's
     * {@link CreateEventParams.requestId}: stamped on every event in the batch
     * so a batched write's usage facts and telemetry carry the same request
     * attribution its single-path twin would.
     */
    requestId?: string;
    /**
     * Whether the run's orchestrator makes this batch (spec >= 9), as
     * {@link CreateEventParams.inBand}. Every event of a batch shares it.
     */
    inBand?: boolean;
    /**
     * The orchestrator's in-band count for the whole block, as
     * {@link CreateEventParams.expectedSeqInBand}. The World allocates the
     * block's positions in one conditional allocation.
     */
    expectedSeqInBand?: number;
    /**
     * The position the batch was decided from, as
     * {@link CreateEventParams.eventCount}; required with `inBand: true`. The
     * response then carries the skipped-slot report for
     * the block at the top level (`events` / `hasMore` on
     * {@link EventBatchResult}).
     */
    eventCount?: number;
}
/**
 * One event's outcome in a batch response, index-aligned with the submitted
 * events. `error === undefined` discriminates success.
 *
 * A batch is processed as a whole (HTTP 200 whenever the World evaluated it);
 * each event reports the outcome its OWN single `create` would have had:
 *
 * - success → `status: 200` plus the committed event and the same
 *   materialized entity the single create returns (`step` for step events,
 *   `wait` for wait events, `run` for run terminals);
 * - rejection → the status code and error code the single create would have
 *   failed with, so callers reuse their single-path conflict handling per
 *   event. A `409`/`conflict` means the entity was not in the prior state
 *   the event requires, most commonly because an earlier delivery already
 *   applied the same event, but possibly because the entity reached a
 *   DIFFERENT state (e.g. `step_completed` conflicting because the step
 *   failed). A 409 alone does not prove the equivalent effect was applied;
 *   a caller that needs effect-equivalence consults the entity (returned on
 *   sibling successes, or reloaded).
 *
 * The batch is atomic per attempt, not all-or-nothing across the submitted
 * set: a World may drop rejected events and commit the survivors, so a batch
 * can return a mix of 200s and 409s from one call.
 *
 * Retry semantics: a transport retry of a committed batch converges to
 * per-event 409s ONLY for entity-conditioned events: creates and terminal
 * transitions. A standalone bare `step_started` or a `step_retrying`
 * re-patches its step on every attempt and does NOT converge, and
 * `hook_received` appends a new row per attempt, so `world-vercel` rejects
 * `hook_received` in a batch outright and only auto-retries batches whose
 * every event is retry-convergent.
 *
 * The born-running `step_created`+`step_started` pair converges (the pair's
 * create fences it) but is still excluded from auto-retry, because
 * convergence alone is not enough for the caller: a pair 409 means "this step
 * already exists", and on a retry that is indistinguishable from "my own
 * previous attempt committed it". A caller that reads the 409 as a lost claim
 * would skip a body it actually owns, so a batch carrying a `step_started`
 * runs single-attempt and leaves transient-failure recovery to queue
 * redelivery.
 */
export type BatchEventItemResult = {
    status: 200;
    error?: undefined;
    message?: undefined;
    event: Event;
    run?: WorkflowRun;
    step?: Step;
    wait?: Wait;
} | {
    status: number;
    error: string;
    message: string;
    event?: undefined;
    run?: undefined;
    step?: undefined;
    wait?: undefined;
};
/** Result of {@link Storage.events.createBatch}. */
export interface EventBatchResult {
    /** One entry per submitted event, in request order. */
    results: BatchEventItemResult[];
    /**
     * The skipped-slot report of an in-band batch (spec >= 9): the events in
     * positions `eventCount + 1` up to the block's first position.
     */
    events?: Event[];
    /**
     * `true` when the skipped-slot report in `events` is incomplete, as
     * `hasMore` on an in-band write's {@link EventResult}: the writer reloads
     * the log before it consumes anything the batch resolves.
     */
    hasMore?: boolean;
    /**
     * How many positions the batch allocated: the admitted items, one block.
     * As {@link EventResult.allocated}; absent when the World does not report
     * it.
     */
    allocated?: number;
}
export interface GetEventParams {
    resolveData?: ResolveData;
    /**
     * The run's spec version, when the caller knows it. A hint a World may use
     * to pick how it reads; it never changes which event is returned. See
     * {@link ListEventsParams.specVersion}.
     */
    specVersion?: number;
}
/**
 * The sequencer state a World read, strongly consistently, before it listed
 * a run's log (spec >= 9). Positions are slots.
 */
export interface EventLogSnapshot {
    /** Highest position allocated to any write when the list began. */
    seq: number;
    /** Number of positions allocated to in-band writes when the list began. */
    seqInBand: number;
}
/**
 * A run's in-band count right after its creation, before any other write:
 * `run_created` counts as the run's first in-band position, so the run's
 * first orchestrator write (`run_started`) expects this value. It is the same
 * when `run_created` never landed and `run_started` creates the run (resilient
 * start): the creation the World performs for it counts in its place.
 *
 * The runtime adopts it in place of a load snapshot when it knows the log
 * holds nothing but the run's creation: a run with no events yet, and turbo
 * mode's first delivery, which skips the initial load.
 */
export declare const IN_BAND_SEQ_AT_RUN_CREATION = 1;
/**
 * Result of {@link Storage.events.list}.
 *
 * `snapshot` is set by a World that implements the in-band writer fence
 * (`WorldCapabilities.inBandFence`), on every page of a slot-numbered run's
 * log where the World reads one. It is read before the listing, so a full
 * load (following `cursor` until `hasMore` is false) covers every position
 * up to the FIRST page's `snapshot.seq`, each one committed or sealed as a
 * `noop`. A fenced writer takes its
 * {@link CreateEventParams.expectedSeqInBand} from the first page's
 * `snapshot.seqInBand`, never from counting events: a count cannot tell
 * which positions were in-band.
 *
 * On a single-orchestrator run (spec >= 9) it is required on every page: the
 * runtime refuses to write in-band from a full load whose first page has
 * none. On earlier runs a fencing World that lists no snapshot reports the
 * counters on a refusal (`InBandSupersededError`) instead.
 */
export type EventListResponse = PaginatedResponse<Event> & {
    snapshot?: EventLogSnapshot;
};
/** Options for {@link Storage.events.subscribe}. */
export interface EventsSubscribeOptions {
    /** Called once when the World stops delivering for a transport reason. */
    onError?: (error: unknown) => void;
}
export interface ListEventsParams {
    runId: string;
    /** Omit `limit` to return every remaining event. */
    pagination?: PaginationOptions;
    resolveData?: EventsResolveData;
    /**
     * Aborted when the caller has given up on the read. A World may stop the
     * request early and reject; one that ignores it is still correct, since the
     * caller no longer uses the result.
     */
    signal?: AbortSignal;
    /**
     * The run's spec version, when the caller knows it. A hint a World may use
     * to pick how it reads; it never changes which events are returned. The
     * spec 9 orchestrator passes it on its own log loads, which need
     * {@link EventListResponse.snapshot}: world-vercel reads a run stamped 9 or
     * above from the route that reports it, and every other read from the route
     * earlier releases use. A World that always returns `snapshot` can ignore
     * it.
     */
    specVersion?: number;
}
export interface ListEventsByCorrelationIdParams {
    correlationId: string;
    /**
     * The run the correlation id belongs to. A correlation id is unique per
     * run, not globally: a slot-numbered run counts its own steps and waits, so
     * `step_…001` names the first step of *every* such run. Naming the run is
     * what makes the answer that run's events, and it is what makes the
     * pagination cursor unambiguous: `(runId, eventId)` is a key where an
     * event id alone is not.
     */
    runId: string;
    pagination?: PaginationOptions;
    resolveData?: ResolveData;
}
//# sourceMappingURL=events.d.ts.map