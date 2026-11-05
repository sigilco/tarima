import { EVE_MESSAGE_STREAM_VERSION } from "#protocol/session-http.js";
/** The one stream version this client reads. Sessions don't cross a major version. */
export type MessageStreamVersion = typeof EVE_MESSAGE_STREAM_VERSION;
/** Reads and validates the schema version declared by a message stream response. */
export declare function readMessageStreamVersion(headers: Headers): MessageStreamVersion;
