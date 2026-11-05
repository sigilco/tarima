interface LinqManagementDeps {
    fetch: typeof fetch;
}
/** Lists the phone numbers assigned to a Linq partner API token. */
export declare function listLinqPhoneNumbers(apiToken: string, signal?: AbortSignal, deps?: LinqManagementDeps): Promise<string[]>;
export {};
