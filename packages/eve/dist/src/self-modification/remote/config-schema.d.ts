import { z } from "#compiled/zod/index.js";
import type { AgentReasoningDefinition, AgentStaticModelDefinition } from "#public/index.js";
import type { GitHubCredentialProvider, SelfModificationAuthorization } from "./config.js";
export declare const deployedSelfModificationConfigSchema: z.ZodObject<{
    model: z.ZodOptional<z.ZodCustom<AgentStaticModelDefinition, AgentStaticModelDefinition>>;
    reasoning: z.ZodOptional<z.ZodCustom<AgentReasoningDefinition, AgentReasoningDefinition>>;
    credentials: z.ZodOptional<z.ZodUnion<readonly [z.ZodObject<{
        pat: z.ZodLiteral<true>;
    }, z.core.$strip>, z.ZodCustom<GitHubCredentialProvider, GitHubCredentialProvider>]>>;
    source: z.ZodObject<{
        git: z.ZodObject<{
            directory: z.ZodString;
            repository: z.ZodString;
        }, z.core.$strip>;
    }, z.core.$strip>;
    target: z.ZodObject<{
        branch: z.ZodString;
    }, z.core.$strip>;
    authorize: z.ZodCustom<SelfModificationAuthorization, SelfModificationAuthorization>;
}, z.core.$strict>;
