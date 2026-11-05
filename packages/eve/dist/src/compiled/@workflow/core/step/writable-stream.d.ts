/**
 * The options for {@link getWritable}.
 */
export interface WorkflowWritableStreamOptions {
    /**
     * An optional namespace to distinguish between multiple streams associated
     * with the same workflow run.
     */
    namespace?: string;
}
/**
 * Retrieves the writable stream associated with the current workflow.
 *
 * Use the writable stream within step functions to write data. Read the data
 * outside the workflow by using the readable method of `getRun`.
 *
 * @param options - Optional configuration for the writable stream
 * @returns The writable stream associated with the current workflow run
 * @throws Error if called outside a workflow or step function
 */
export declare function getWritable<W = any>(options?: WorkflowWritableStreamOptions): WritableStream<W>;
//# sourceMappingURL=writable-stream.d.ts.map