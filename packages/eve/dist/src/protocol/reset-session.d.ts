import { z } from "#compiled/zod/index.js";
/** Successful response returned by the standard session-reset route. */
export type ResetResponse = {
    readonly ok: true;
    readonly previousSessionId: string;
    readonly status: "reset";
} | {
    readonly ok: true;
    readonly status: "no_active_session";
};
/** Validates successful responses from the standard session-reset route. */
export declare const ResetResponseSchema: z.ZodType<ResetResponse>;
