import { z } from "#compiled/zod/index.js";
import type { AgentReasoningDefinition, AgentStaticModelDefinition } from "#public/index.js";
export declare const selfModificationConfigSchema: z.ZodObject<{
    model: z.ZodOptional<z.ZodCustom<AgentStaticModelDefinition, AgentStaticModelDefinition>>;
    reasoning: z.ZodOptional<z.ZodCustom<AgentReasoningDefinition, AgentReasoningDefinition>>;
    local: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>>;
    deployed: z.ZodOptional<z.ZodCustom<never, never>>;
}, z.core.$strict>;
