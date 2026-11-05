import { ClientError } from "#client/client-error.js";
/** Whether a client error is the info route refusing the caller's credential. */
export declare function isAgentInfoForbidden(error: unknown): error is ClientError;
/** Says which credential `GET /eve/v1/info` accepts, for callers it refused. */
export declare function formatAgentInfoForbiddenMessage(target: string): string;
