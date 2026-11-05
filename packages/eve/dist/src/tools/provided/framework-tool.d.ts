/** Keeps framework identity on definitions even when their runtime names change. */
export declare function frameworkTool<T extends object>(definition: T): T;
export declare function isFrameworkTool(definition: object): boolean;
/**
 * Marks a built-in executor that acts only on the conversation: asking a question, ending the
 * turn, waiting. The mark sits on the function, so a definition keeps it only while it runs that
 * exact executor, whatever it is named or spread into.
 */
export declare function interactionOnly<F extends (...args: never[]) => unknown>(execute: F): F;
/** Whether `value` is, or is a definition resolved from, an {@link interactionOnly} executor. */
export declare function isInteractionOnly(value: unknown): boolean;
/** Carries an executor's {@link interactionOnly} mark onto its resolved definition. */
export declare function markInteractionOnly<T extends object>(definition: T): T;
