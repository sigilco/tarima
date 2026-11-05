import { type ToolDefinition } from "#public/tools/index.js";
export interface EditFileToolEdit {
    newText: string;
    oldText: string;
}
export interface EditFileToolInput {
    edits: EditFileToolEdit[];
    path: string;
}
export interface EditFileToolOutput {
    /** The path as the model gave it. */
    path: string;
    replacements: number;
}
/**
 * Framework-owned executor that edits files in the default sandbox.
 */
export declare const editFile: ToolDefinition<EditFileToolInput, EditFileToolOutput>;
export default editFile;
