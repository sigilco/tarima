import { EveError } from "#shared/eve-error.js";
/** A successful health request returned an unusable payload. */
export declare class HealthResponseError extends EveError {
    static readonly errorName = "HealthResponseError";
    readonly code: "invalid_health_response";
    readonly issues: readonly string[];
    constructor(issues?: readonly string[]);
}
