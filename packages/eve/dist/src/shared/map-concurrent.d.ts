/** Maps independent work in order, draining every started task before rejecting. */
export declare function mapConcurrent<T, R>(values: readonly T[], operation: (value: T, index: number) => Promise<R>, concurrency?: number): Promise<R[]>;
