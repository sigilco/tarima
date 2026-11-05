import type { SessionStreamEvent } from "#protocol/session-event.js";
/** Formats the user and assistant messages observed in one eval session. */
export declare function formatEvalTranscript(events: readonly SessionStreamEvent[]): string;
/** Infers the media type used when an eval attaches a local file. */
export declare function inferMediaType(filePath: string): string;
