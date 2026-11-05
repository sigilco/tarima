export declare const MAX_ACTIVITY_TEXT_LENGTH = 500;
/** Normalizes bounded untrusted presentation text before it reaches a renderer. */
export declare function normalizePresentationText(text: string): string;
/**
 * The first sentence of the text's first non-empty line, normalized: a brief
 * for a message or result. Returns `undefined` when there is no text.
 */
export declare function firstSentence(text: string): string | undefined;
