import type { DeliverPayload } from "#channel/types.js";
/** The command with each payload's answers also under the name a pre-v27 owner reads. */
export declare function withPreV27Answers<T>(command: T): T;
/** The payload without the pre-v27 alias, which v27 code never reads. */
export declare function withoutPreV27Answers(payload: DeliverPayload): DeliverPayload;
