import { z } from "#compiled/zod/index.js";
import type { JsonValue } from "./envelope.js";
/**
 * A schema that parses to exactly `T`. Checked at compile time both ways, so the build fails when
 * the two drift apart: a field one has and the other lacks, a field one requires and the other
 * leaves optional, or a value one accepts and the other doesn't.
 */
export declare function conforming<T>(): <TSchema extends z.ZodType>(schema: TSchema & ([z.output<TSchema>] extends [T] ? [T] extends [DeepReadonly<z.output<TSchema>>] ? [Exclude<KeysOf<T>, KeysOf<z.output<TSchema>>>] extends [never] ? [Exclude<KeysOf<z.output<TSchema>>, KeysOf<T>>] extends [never] ? unknown : {
    readonly missingFromType: Exclude<KeysOf<z.output<TSchema>>, KeysOf<T>>;
} : {
    readonly missingFromSchema: Exclude<KeysOf<T>, KeysOf<z.output<TSchema>>>;
} : {
    readonly schemaRejectsSome: T;
} : {
    readonly schemaDoesNotParseTo: T;
})) => TSchema;
type KeysOf<T> = T extends unknown ? keyof T : never;
/** Public types are read-only and parsed values aren't; only the shapes are compared. */
type DeepReadonly<T> = T extends readonly (infer U)[] ? readonly DeepReadonly<U>[] : T extends object ? {
    readonly [K in keyof T]: DeepReadonly<T[K]>;
} : T;
/**
 * A string whose values the stream names: it parses open, so a reader keeps what a newer writer
 * sends, and types as the values known today, so a reader's switch keeps a default branch.
 * A plain string, not `z.custom`, so schemas published as JSON Schema (MCP tool output) can
 * still describe it.
 */
export declare function known<T extends string>(): z.ZodType<T>;
export declare const id: z.ZodString;
export declare const jsonValue: z.ZodType<JsonValue>;
export declare const scope: z.ZodObject<{
    changeId: z.ZodOptional<z.ZodString>;
    runId: z.ZodOptional<z.ZodString>;
    taskId: z.ZodOptional<z.ZodString>;
    turnId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const cause: z.ZodUnion<readonly [z.ZodObject<{
    deliveryId: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    turnId: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    taskId: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    callId: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    interactionId: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    responseId: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    changeId: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    policy: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    hook: z.ZodString;
}, z.core.$strip>]>;
export declare const principal: z.ZodObject<{
    id: z.ZodString;
    issuer: z.ZodOptional<z.ZodString>;
    type: z.ZodString;
}, z.core.$strip>;
export declare const errorInfo: z.ZodObject<{
    code: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    hint: z.ZodOptional<z.ZodString>;
    id: z.ZodOptional<z.ZodString>;
    message: z.ZodString;
}, z.core.$strip>;
export declare const usage: z.ZodObject<{
    cacheReadTokens: z.ZodNumber;
    cacheWriteTokens: z.ZodNumber;
    costUsd: z.ZodOptional<z.ZodNumber>;
    inputTokens: z.ZodNumber;
    outputTokens: z.ZodNumber;
}, z.core.$strip>;
export declare const valueReference: z.ZodObject<{
    mediaType: z.ZodOptional<z.ZodString>;
    preview: z.ZodOptional<z.ZodString>;
    ref: z.ZodOptional<z.ZodString>;
    size: z.ZodOptional<z.ZodNumber>;
    withheld: z.ZodOptional<z.ZodLiteral<true>>;
}, z.core.$strip>;
export declare const userPart: z.ZodUnion<readonly [z.ZodObject<{
    kind: z.ZodLiteral<"text">;
    text: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    filename: z.ZodOptional<z.ZodString>;
    kind: z.ZodLiteral<"file">;
    mediaType: z.ZodString;
    ref: z.ZodOptional<z.ZodString>;
    size: z.ZodOptional<z.ZodNumber>;
    unavailable: z.ZodOptional<z.ZodLiteral<true>>;
    url: z.ZodOptional<z.ZodString>;
}, z.core.$strip>]>;
/** The schema of one fact or progress record's envelope around its payload. */
export declare function envelopeOf<TType extends string>(type: TType, data: z.ZodType): z.ZodObject<{
    data: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
    scope: z.ZodOptional<z.ZodObject<{
        changeId: z.ZodOptional<z.ZodString>;
        runId: z.ZodOptional<z.ZodString>;
        taskId: z.ZodOptional<z.ZodString>;
        turnId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    type: z.ZodLiteral<TType>;
}, z.core.$strip>;
export {};
