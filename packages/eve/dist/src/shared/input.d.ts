import { z } from "#compiled/zod/index.js";
import type { Answer } from "#protocol/session-events/families/response.js";
export type { Answer };
/** Zod schema for one answer. */
export declare const answerSchema: z.ZodObject<{
    interactionId: z.ZodString;
    optionId: z.ZodOptional<z.ZodString>;
    text: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
declare const validatedAnswerBrand: unique symbol;
/** An answer proven to match the strict durable wire schema. */
export type ValidatedAnswer = Answer & {
    readonly [validatedAnswerBrand]: true;
};
/** Parses one answer and preserves schema validation in its static type. */
export declare function parseAnswer(value: unknown): ValidatedAnswer;
/** Parses answer arrays whose element types were widened before delivery. */
export declare function parseAnswers(value: unknown): readonly ValidatedAnswer[];
type IsWidenedAnswer<TAnswer extends Answer> = keyof TAnswer extends keyof Answer ? keyof Answer extends keyof TAnswer ? Answer extends TAnswer ? true : false : false : false;
type StrictAnswer<TAnswer extends Answer> = TAnswer extends ValidatedAnswer ? TAnswer : IsWidenedAnswer<TAnswer> extends true ? never : TAnswer & {
    readonly [TKey in Exclude<keyof TAnswer, keyof Answer>]: never;
};
/** Rejects extra answer keys and imprecise arrays not proven by the strict schema. */
export type StrictAnswers<TAnswers extends readonly Answer[]> = TAnswers & {
    readonly [TIndex in keyof TAnswers]: TAnswers[TIndex] extends Answer ? StrictAnswer<TAnswers[TIndex]> : TAnswers[TIndex];
};
/** Returns true when a value matches the answer contract. */
export declare function isAnswer(value: unknown): value is ValidatedAnswer;
export { APPROVE_OPTION_ID, DENY_OPTION_ID } from "#protocol/interaction-options.js";
