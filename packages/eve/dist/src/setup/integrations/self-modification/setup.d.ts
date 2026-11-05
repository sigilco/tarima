import { type SelfModificationSetupOperations, type SelfModificationSetupValues } from "#self-modification/setup.js";
import type { VercelProjectReference } from "#setup/project-resolution.js";
import { ensurePackageDependencies } from "#setup/scaffold/index.js";
import { installScaffoldDependencies } from "../shared/scaffold.js";
import { type SetupApplyContext, type SetupPrepareContext } from "../types.js";
export interface SelfModificationApplyDependencies {
    ensurePackageDependencies: typeof ensurePackageDependencies;
    installScaffoldDependencies: typeof installScaffoldDependencies;
}
type SelfModificationSetupPlan = {
    readonly kind: "authored";
} | {
    readonly kind: "local";
} | {
    readonly kind: "deployed";
    readonly connectorName: string;
    readonly project: VercelProjectReference;
    readonly values: SelfModificationSetupValues;
};
export declare function prepareSelfModificationSetup(context: SetupPrepareContext, operations?: SelfModificationSetupOperations): Promise<SelfModificationSetupPlan>;
export declare function applySelfModificationSetup(plan: SelfModificationSetupPlan, context: SetupApplyContext, operations?: SelfModificationSetupOperations, deps?: SelfModificationApplyDependencies): Promise<{
    facts: {
        label: string;
        value: string;
    }[];
    deploymentRequired?: undefined;
} | {
    deploymentRequired: true;
    facts: {
        label: string;
        value: string;
    }[];
}>;
export declare function prepareLocalSelfModificationSetup(context: SetupPrepareContext, operations?: SelfModificationSetupOperations): Promise<SelfModificationSetupPlan>;
export declare const SELF_MODIFICATION_SETUP: import("../types.js").SetupIntegration;
export declare const SELF_MODIFICATION_PRODUCTION_SETUP: import("../types.js").SetupIntegration;
export {};
