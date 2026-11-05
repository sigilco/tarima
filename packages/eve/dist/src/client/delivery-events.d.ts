import type { SessionStreamEvent } from "#protocol/session-event.js";
/** Reads the commit that admits this delivery through its settlement's whole commit. */
export declare function deliveryEvents(source: AsyncIterable<SessionStreamEvent>, deliveryId: string, signal?: AbortSignal, beforeAdmission?: (event: SessionStreamEvent) => void): AsyncGenerator<SessionStreamEvent>;
