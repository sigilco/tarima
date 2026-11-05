/**
 * Routes AI SDK provider warnings through eve's logger unless the application
 * already configured the SDK's global warning hook. AI SDK warnings are
 * successful-call diagnostics, so they use the info channel instead of stderr.
 */
export declare function ensureAiSdkWarningLogger(): void;
