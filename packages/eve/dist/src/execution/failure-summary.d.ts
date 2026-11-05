import type { JsonObject } from "#shared/json.js";
/**
 * A thrown error as a failure reports it. Cataloged failures replace the raw identity with the
 * curated one; the `detail` dump stays in `details` so the session trace keeps the raw evidence
 * while the transcript shows the actionable summary.
 */
export declare function summarizeFailure(error: unknown, fallbackCode: string): {
    readonly code: string;
    readonly details: JsonObject;
    readonly message: string;
};
