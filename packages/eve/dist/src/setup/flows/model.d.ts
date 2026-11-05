/**
 * Refusal message when `/model` can't rewrite the model — it is a source-backed
 * SDK model call (`gateway(...)`, `anthropic(...)`), not a string literal — or
 * null when the model is an editable string. Editability is independent of
 * routing: a `gateway(...)` call is gateway-routed yet still uneditable here.
 */
export declare function modelChangeRefusalForUneditableModel(appRoot: string): Promise<string | null>;
