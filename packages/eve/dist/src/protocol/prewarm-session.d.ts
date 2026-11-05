import { z } from "#compiled/zod/index.js";
/** Acceptance is durable, but does not mean the successor has activated. */
export type PrewarmSessionResult = {
    readonly status: "ready" | "accepted" | "unsupported" | "no_active_session";
};
export declare const PrewarmResponseSchema: z.ZodObject<{
    ok: z.ZodLiteral<true>;
    status: z.ZodEnum<{
        accepted: "accepted";
        no_active_session: "no_active_session";
        ready: "ready";
        unsupported: "unsupported";
    }>;
}, z.core.$strip>;
