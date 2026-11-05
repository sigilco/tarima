import { appendEnv } from "#setup/append-env.js";
import { writeTextFile } from "#setup/scaffold/files.js";
import { type SetupApplyContext, type SetupPrepareContext } from "../types.js";
export interface ShopifySetupDeps {
    appendEnv: typeof appendEnv;
    writeTextFile: typeof writeTextFile;
}
interface ShopifySetupPlan {
    storeDomain: string;
}
export declare function prepareShopifySetup(context: SetupPrepareContext): Promise<ShopifySetupPlan>;
export declare function applyShopifySetup(plan: ShopifySetupPlan, context: SetupApplyContext, deps?: ShopifySetupDeps): Promise<{
    deploymentRequired: true;
    facts: {
        label: string;
        value: string;
        kind: "text";
    }[];
}>;
export declare const SHOPIFY_SETUP: import("../types.js").SetupIntegration;
export {};
