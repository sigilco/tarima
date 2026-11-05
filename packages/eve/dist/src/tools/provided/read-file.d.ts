import { type ToolDefinition } from "#tools/definition.js";
export interface ReadFileToolInput {
    filePath: string;
    limit?: number;
    offset?: number;
}
export interface ReadFileToolOutput {
    content: string;
    /** Set when the file is a PNG, JPEG, GIF, or WebP image or a PDF that the model reads natively. */
    file?: {
        height?: number;
        mediaType: string;
        pages?: number;
        size: number;
        width?: number;
    };
    nextOffset?: number;
    path: string;
    totalLines: number;
    truncated: boolean;
}
/**
 * Input schema for the provided `read_file` tool.
 */
export declare const READ_FILE_INPUT_SCHEMA: import("#tools/schema.js").ToolSchema<ReadFileToolInput, ReadFileToolInput>;
/**
 * Output schema for the provided `read_file` tool.
 */
export declare const READ_FILE_OUTPUT_SCHEMA: import("#tools/schema.js").ToolSchema<ReadFileToolOutput, ReadFileToolOutput>;
/**
 * Framework-owned executor that delegates to the default sandbox.
 */
export declare const readFile: ToolDefinition<ReadFileToolInput, ReadFileToolOutput>;
export default readFile;
