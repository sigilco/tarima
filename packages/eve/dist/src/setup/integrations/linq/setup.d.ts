import type { VercelProjectReference } from "#setup/project-resolution.js";
import { type LinqExistingAccountCredentials } from "./connect.js";
import { listLinqPhoneNumbers } from "./management.js";
import { type SetupPrepareContext } from "../types.js";
export interface LinqSetupDeps {
    listPhoneNumbers: typeof listLinqPhoneNumbers;
}
interface LinqSetupPlan {
    credentials: "connect" | "portable";
    connectorSlug?: string;
    existingAccount?: LinqExistingAccountCredentials;
    project?: VercelProjectReference;
    apiKey?: string;
    signingSecret?: string;
}
export declare function prepareLinqSetup(context: SetupPrepareContext, deps?: LinqSetupDeps): Promise<LinqSetupPlan>;
export declare const LINQ_SETUP: import("../types.js").SetupIntegration;
export {};
