import { z } from "zod";
import type { GitHubAppAuthorizeRequest, GitHubAttribution, GitHubAuthorize, GitHubConfig, GitHubUserAuthorizeRequest } from "./lib/github-shell.ts";
export type { GitHubLeaseRule } from "./lib/github-shell.ts";
export type { GitHubCoAuthor } from "./lib/github-shell.ts";
export type { GitHubAppAuthorizeRequest, GitHubAuthorize, GitHubAuthorizeRequest, GitHubUserAuthorizeRequest, } from "./lib/github-shell.ts";
export type GitHubLeaseBroker = GitHubConfig["broker"];
export type { GitHubAttribution } from "./lib/github-shell.ts";
declare const _default: import("eve/extension").ExtensionHandle<z.ZodObject<{
    github: z.ZodOptional<z.ZodDiscriminatedUnion<[z.ZodObject<{
        connector: z.ZodString;
        broker: z.ZodCustom<(sandbox: import("../../../shared/sandbox-session.ts").SandboxSession, rules: Readonly<Record<string, readonly import("./lib/github-shell.ts").GitHubLeaseRule[]>> | null) => Promise<void>, (sandbox: import("../../../shared/sandbox-session.ts").SandboxSession, rules: Readonly<Record<string, readonly import("./lib/github-shell.ts").GitHubLeaseRule[]>> | null) => Promise<void>>;
        attribution: z.ZodOptional<z.ZodCustom<GitHubAttribution, GitHubAttribution>>;
        authorize: z.ZodCustom<GitHubAuthorize<GitHubAppAuthorizeRequest>, GitHubAuthorize<GitHubAppAuthorizeRequest>>;
        principalType: z.ZodLiteral<"app">;
    }, z.core.$strip>, z.ZodObject<{
        connector: z.ZodString;
        broker: z.ZodCustom<(sandbox: import("../../../shared/sandbox-session.ts").SandboxSession, rules: Readonly<Record<string, readonly import("./lib/github-shell.ts").GitHubLeaseRule[]>> | null) => Promise<void>, (sandbox: import("../../../shared/sandbox-session.ts").SandboxSession, rules: Readonly<Record<string, readonly import("./lib/github-shell.ts").GitHubLeaseRule[]>> | null) => Promise<void>>;
        attribution: z.ZodOptional<z.ZodCustom<GitHubAttribution, GitHubAttribution>>;
        authorize: z.ZodCustom<GitHubAuthorize<GitHubUserAuthorizeRequest>, GitHubAuthorize<GitHubUserAuthorizeRequest>>;
        principalType: z.ZodLiteral<"user">;
    }, z.core.$strip>], "principalType">>;
}, z.core.$strip>>;
export default _default;
