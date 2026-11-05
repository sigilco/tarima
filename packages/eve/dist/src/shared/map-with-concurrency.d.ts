/** Maps `items` with at most `limit` calls in flight, preserving input order. */
export declare function mapWithConcurrency<T, R>(items: readonly T[], limit: number, map: (item: T) => Promise<R>): Promise<R[]>;
