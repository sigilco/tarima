import * as z from '#compiled/zod/index.js';
export * from './attributes-validation.js';
export declare const AttributeKeySchema: z.ZodString;
export declare const AttributeValueSchema: z.ZodNullable<z.ZodString>;
/** Runtime schema for a single run-attribute change. */
export declare const AttributeChangeSchema: z.ZodObject<{
    key: z.ZodString;
    value: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
export declare const AttributeChangesSchema: z.ZodArray<z.ZodObject<{
    key: z.ZodString;
    value: z.ZodNullable<z.ZodString>;
}, z.core.$strip>>;
/** The post-merge attribute snapshot returned by a World. */
export interface ExperimentalSetAttributesResult {
    attributes: Record<string, string>;
}
//# sourceMappingURL=attributes.d.ts.map