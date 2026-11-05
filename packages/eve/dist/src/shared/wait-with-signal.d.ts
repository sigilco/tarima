/** Stops waiting without claiming to cancel work whose owner does not accept a signal. */
export declare function waitWithSignal<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T>;
