import { type ScopedAuthorization } from "#runtime/connections/scoped-authorization.js";
/** Record successful completion before returning to authored code. */
export declare function completeWorkflowStepAuthorization(scoped: ScopedAuthorization): Promise<boolean>;
