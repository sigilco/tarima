/** Stop waiting at the eval deadline even if a provider ignores cancellation. */
export declare function runUntilAborted<T>(task: T | PromiseLike<T>, signal: AbortSignal): Promise<T>;
