import { type ToolModelOutput } from "#public/tools/index.js";
/** What a provided tool returns when a new message stops it early. */
export interface InterruptedOutput {
    readonly interrupted: true;
}
/** The model sees an interrupted call as text and every other output as JSON, as it would by default. */
export declare function toInterruptibleModelOutput(output: object): ToolModelOutput;
export declare const INTERRUPTED_OUTPUT_SCHEMA: {
    readonly type: "object";
    readonly properties: {
        readonly interrupted: {
            readonly type: "boolean";
            readonly const: true;
        };
    };
    readonly required: readonly ["interrupted"];
    readonly additionalProperties: false;
};
