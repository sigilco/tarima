export declare const inputTextKey = "__eveInputText";
/**
 * Attaches the text a person typed, for channels whose model-visible message
 * wraps it in an envelope. Pending input requests resolve against this text, so
 * a typed `approve` or option label still answers them. Empty text answers
 * nothing.
 */
export declare function attachInputText<T extends object>(target: T, text: string | undefined): T;
export declare function readInputText(target: object | undefined): string | undefined;
/** The text pending input resolves against: the typed text, else a plain string message. */
export declare function readAnswerText(target: (object & {
    readonly message?: unknown;
}) | undefined): string | undefined;
