import type { VercelProjectReference } from "#setup/project-resolution.js";
/** Provisions team-only browser sign-in without rotating existing project credentials. */
export declare function provisionWebChatAuth(project: VercelProjectReference, signal?: AbortSignal): Promise<void>;
