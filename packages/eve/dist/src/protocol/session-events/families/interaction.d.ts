import { z } from "#compiled/zod/index.js";
import type { Cause, Envelope, JsonValue } from "../envelope.js";
/** What an interaction is about. */
export type InteractionSubject = {
    readonly callId: string;
} | {
    readonly turnId: string;
} | {
    readonly taskId: string;
} | {
    readonly responseId: string;
};
/**
 * What kind of thing a person is asked. A newer eve can add a kind: a reader shows one it doesn't
 * know from the common fields, so its switch keeps a default branch.
 */
export type InteractionKind = "approval" | "question" | "sign-in" | "budget";
/** How a request suggests showing its choices. A hint: a newer eve can add one. */
export type InteractionDisplay = "confirmation" | "select" | "text";
/** How an option suggests looking. A hint: a newer eve can add one. */
export type InteractionOptionStyle = "primary" | "danger" | "default";
export interface InteractionOption {
    readonly id: string;
    readonly label: string;
    readonly description?: string;
    readonly style?: InteractionOptionStyle;
}
/**
 * What a person is asked. Every request renders from the common fields, so a reader that doesn't
 * know a kind can still show it and answer through options, free text, or the link.
 */
export interface InteractionRequest {
    readonly kind: InteractionKind;
    readonly prompt: string;
    readonly title?: string;
    readonly options?: readonly InteractionOption[];
    readonly allowFreeform?: boolean;
    readonly display?: InteractionDisplay;
    readonly link?: {
        readonly url: string;
        readonly label?: string;
    };
    /** A sign-in's challenge. */
    readonly signIn?: SignInChallenge;
}
/** What a sign-in asks the person to do, visible to the same readers as today. */
export interface SignInChallenge {
    /** The connection or tool that needs the sign-in. */
    readonly name: string;
    readonly displayName?: string;
    readonly url?: string;
    readonly userCode?: string;
    readonly expiresAt?: string;
    readonly instructions?: string;
    readonly callbackUrl?: string;
    /** The credential the sign-in grants, shared by every connection or tool that uses it. */
    readonly grant?: string;
    /**
     * The connection principal the sign-in is for, without its attributes. `type` is open:
     * `"user"`, which has an `id`, and `"app"` today.
     */
    readonly principal?: {
        readonly type: string;
        readonly id?: string;
        readonly issuer?: string;
    };
}
/** Where a relayed request was asked: the child session's request, and the call it asks about. */
export interface InteractionOrigin {
    readonly sessionId: string;
    readonly interactionId: string;
    /**
     * The asker's call, when it asks about one, such as the tool a child wants approved. This
     * session's tables hold only the call that delegated to the child.
     */
    readonly call?: {
        readonly callId: string;
        readonly name: string;
        readonly input?: JsonValue;
    };
}
export interface InteractionOpenedData {
    readonly interactionId: string;
    readonly subject: InteractionSubject;
    readonly request: InteractionRequest;
    /** The child session's request this one relays. */
    readonly origin?: InteractionOrigin;
    /** Who the request is for, such as the principal that started a sign-in. */
    readonly audience?: {
        readonly principalIds: readonly string[];
    };
}
export type InteractionOutcome = "accepted" | "declined" | "invalid" | "failed" | "withdrawn" | "interrupted" | "abandoned" | "expired";
export interface InteractionSettledData {
    readonly interactionId: string;
    readonly outcome: InteractionOutcome;
    /** Open, such as `superseded-by-message` for a withdrawal. */
    readonly reason?: string;
    /** The response that decided it, or what else settled it. */
    readonly cause?: Cause;
    /** Kind-specific detail of the outcome, such as the chosen option. */
    readonly response?: {
        readonly [key: string]: JsonValue;
    };
}
export type InteractionOpened = Envelope<"interaction.opened", InteractionOpenedData>;
export type InteractionSettled = Envelope<"interaction.settled", InteractionSettledData>;
export type InteractionFact = InteractionOpened | InteractionSettled;
/** Zod schema for what a person is asked. */
export declare const interactionRequestSchema: z.ZodObject<{
    allowFreeform: z.ZodOptional<z.ZodBoolean>;
    display: z.ZodOptional<z.ZodType<InteractionDisplay, unknown, z.core.$ZodTypeInternals<InteractionDisplay, unknown>>>;
    kind: z.ZodType<InteractionKind, unknown, z.core.$ZodTypeInternals<InteractionKind, unknown>>;
    link: z.ZodOptional<z.ZodObject<{
        label: z.ZodOptional<z.ZodString>;
        url: z.ZodString;
    }, z.core.$strip>>;
    options: z.ZodOptional<z.ZodArray<z.ZodObject<{
        description: z.ZodOptional<z.ZodString>;
        id: z.ZodString;
        label: z.ZodString;
        style: z.ZodOptional<z.ZodType<InteractionOptionStyle, unknown, z.core.$ZodTypeInternals<InteractionOptionStyle, unknown>>>;
    }, z.core.$strip>>>;
    prompt: z.ZodString;
    signIn: z.ZodOptional<z.ZodObject<{
        callbackUrl: z.ZodOptional<z.ZodString>;
        displayName: z.ZodOptional<z.ZodString>;
        expiresAt: z.ZodOptional<z.ZodString>;
        grant: z.ZodOptional<z.ZodString>;
        instructions: z.ZodOptional<z.ZodString>;
        name: z.ZodString;
        principal: z.ZodOptional<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            issuer: z.ZodOptional<z.ZodString>;
            type: z.ZodString;
        }, z.core.$strip>>;
        url: z.ZodOptional<z.ZodString>;
        userCode: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    title: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const interactionSchemas: {
    "interaction.opened": z.ZodObject<{
        data: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
        scope: z.ZodOptional<z.ZodObject<{
            changeId: z.ZodOptional<z.ZodString>;
            runId: z.ZodOptional<z.ZodString>;
            taskId: z.ZodOptional<z.ZodString>;
            turnId: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        type: z.ZodLiteral<"interaction.opened">;
    }, z.core.$strip>;
    "interaction.settled": z.ZodObject<{
        data: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
        scope: z.ZodOptional<z.ZodObject<{
            changeId: z.ZodOptional<z.ZodString>;
            runId: z.ZodOptional<z.ZodString>;
            taskId: z.ZodOptional<z.ZodString>;
            turnId: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        type: z.ZodLiteral<"interaction.settled">;
    }, z.core.$strip>;
};
