import { z } from "#compiled/zod/index.js";
export declare const HealthResultSchema: z.ZodObject<{
    ok: z.ZodLiteral<true>;
    status: z.ZodLiteral<"ready">;
    workflowId: z.ZodString;
}, z.core.$strict>;
export type { HealthResult } from "./health-types.js";
