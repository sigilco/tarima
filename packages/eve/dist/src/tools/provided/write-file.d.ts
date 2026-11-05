export { refreshReadFileStamp } from "#execution/sandbox/write-file.js";
import { type ToolDefinition } from "#tools/definition.js";
export interface WriteFileToolInput {
    content: string;
    filePath: string;
}
export interface WriteFileToolOutput {
    existed: boolean;
    path: string;
}
/**
 * Input schema for the provided `write_file` tool.
 */
export declare const WRITE_FILE_INPUT_SCHEMA: import("#tools/schema.js").ToolSchema<WriteFileToolInput, WriteFileToolInput>;
/**
 * Output schema for the provided `write_file` tool.
 */
export declare const WRITE_FILE_OUTPUT_SCHEMA: import("#tools/schema.js").ToolSchema<WriteFileToolOutput, WriteFileToolOutput>;
/**
 * Framework-owned executor that delegates to the default sandbox.
 */
export declare const writeFile: ToolDefinition<WriteFileToolInput, WriteFileToolOutput>;
export default writeFile;
