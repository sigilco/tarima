/**
 * Races reads across several hooks. A read that lands while no race is waiting
 * is kept until one claims it: the owner awaits steps between races, and a
 * resume arriving then must not be dropped or re-issued. Claims follow array
 * order because separate hooks carry no order between them.
 */
export interface ChannelReader<C extends string, T> {
    readonly channel: C;
    readonly iterator: AsyncIterator<T>;
    /** Reads that have landed and not yet been claimed, oldest first. */
    readonly landed: IteratorResult<T>[];
    failure?: {
        readonly error: unknown;
    };
    pending?: Promise<void>;
}
export declare function createChannelReader<C extends string, T>(channel: C, iterable: AsyncIterable<T>): ChannelReader<C, T>;
type ChannelReadResult<R> = R extends ChannelReader<infer C, infer T> ? {
    readonly channel: C;
    readonly next: IteratorResult<T>;
} : never;
type ChannelRead<R extends readonly ChannelReader<string, unknown>[]> = ChannelReadResult<R[number]>;
/**
 * Channel reads wake the loop with `undefined` after buffering their result;
 * a cancel wins the race outright.
 */
export declare function raceChannelReads<const R extends readonly ChannelReader<string, unknown>[]>(readers: R): Promise<ChannelRead<R>>;
export declare function raceChannelReads<const R extends readonly ChannelReader<string, unknown>[]>(readers: R, cancelled: Promise<"cancel"> | undefined): Promise<ChannelRead<R> | "cancel">;
export {};
