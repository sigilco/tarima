/**
 * Posts one framework callback payload with the shared callback transport policy.
 *
 * Callback URLs are caller-supplied, so delivery only connects to public
 * addresses (loopback is also allowed on local development servers), checked
 * against every resolved address at connect time.
 */
export declare function postSessionCallbackRequest(input: {
    readonly body: unknown;
    /** Set false when the caller owns failure logging, such as best-effort activity. */
    readonly logFailures?: boolean;
    readonly timeoutMs?: number;
    readonly url: string;
}): Promise<Response>;
