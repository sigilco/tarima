import { z } from "#compiled/zod/index.js";
import type { Interaction } from "#protocol/session-projection/reader.js";
/** Shared JSON projection for invocation results. Sign-in callbacks stay on the server. */
export declare const interactionJsonSchema: z.ZodObject<{
    interactionId: z.ZodString;
    request: z.ZodObject<{
        allowFreeform: z.ZodOptional<z.ZodBoolean>;
        display: z.ZodOptional<z.ZodType<import("#protocol/session-events/families/interaction.js").InteractionDisplay, unknown, z.core.$ZodTypeInternals<import("#protocol/session-events/families/interaction.js").InteractionDisplay, unknown>>>;
        kind: z.ZodType<import("#protocol/session-events/families/interaction.js").InteractionKind, unknown, z.core.$ZodTypeInternals<import("#protocol/session-events/families/interaction.js").InteractionKind, unknown>>;
        link: z.ZodOptional<z.ZodObject<{
            label: z.ZodOptional<z.ZodString>;
            url: z.ZodString;
        }, z.core.$strip>>;
        options: z.ZodOptional<z.ZodArray<z.ZodObject<{
            description: z.ZodOptional<z.ZodString>;
            id: z.ZodString;
            label: z.ZodString;
            style: z.ZodOptional<z.ZodType<import("#protocol/session-events/families/interaction.js").InteractionOptionStyle, unknown, z.core.$ZodTypeInternals<import("#protocol/session-events/families/interaction.js").InteractionOptionStyle, unknown>>>;
        }, z.core.$strip>>>;
        prompt: z.ZodString;
        title: z.ZodOptional<z.ZodString>;
        signIn: z.ZodOptional<z.ZodObject<{
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
    }, z.core.$strip>;
    call: z.ZodOptional<z.ZodObject<{
        callId: z.ZodString;
        name: z.ZodString;
        input: z.ZodOptional<z.ZodJSONSchema>;
    }, z.core.$strip>>;
    status: z.ZodEnum<{
        open: "open";
        settled: "settled";
    }>;
    outcome: z.ZodOptional<z.ZodEnum<{
        abandoned: "abandoned";
        accepted: "accepted";
        declined: "declined";
        expired: "expired";
        failed: "failed";
        interrupted: "interrupted";
        invalid: "invalid";
        withdrawn: "withdrawn";
    }>>;
    reason: z.ZodOptional<z.ZodString>;
    answer: z.ZodOptional<z.ZodObject<{
        interactionId: z.ZodString;
        optionId: z.ZodOptional<z.ZodString>;
        text: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    turnId: z.ZodString;
    stepIndex: z.ZodNumber;
    taskId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare function interactionJson(value: Interaction): z.infer<typeof interactionJsonSchema>;
