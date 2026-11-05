import { type ToolDefinition } from "#tools/definition.js";
export interface WebFetchToolInput {
    format?: "markdown" | "text" | "html";
    timeout?: number;
    url: string;
}
export interface WebFetchToolOutput {
    content: string;
    contentType: string;
    truncated: boolean;
    url: string;
}
export declare const WEB_FETCH_INPUT_SCHEMA: import("#tools/schema.js").ToolSchema<WebFetchToolInput, WebFetchToolInput>;
export declare const WEB_FETCH_OUTPUT_SCHEMA: import("#tools/schema.js").ToolSchema<WebFetchToolOutput, WebFetchToolOutput>;
export declare const webFetch: ToolDefinition<WebFetchToolInput, WebFetchToolOutput>;
export default webFetch;
