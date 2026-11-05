declare const PAGES: {
    readonly authorized: {
        readonly title: "Authorization complete";
        readonly icon: "M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-4.47-1.47.53-.53L11 4.94l-.53.53L6.5 9.44l-.97-.97L5 7.94 3.94 9l.53.53 1.5 1.5c.3.3.77.3 1.06 0z";
    };
    readonly failed: {
        readonly title: "Authorization not completed";
        readonly icon: "M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8 6.94l2.47-2.47 1.06 1.06L9.06 8l2.47 2.47-1.06 1.06L8 9.06l-2.47 2.47-1.06-1.06L6.94 8 4.47 5.53l1.06-1.06z";
    };
};
/**
 * Renders the static HTML landing page that the user's browser sees
 * after an OAuth IdP redirects back to the framework's connection
 * callback route. `failed` covers callbacks where the IdP reported an
 * error, such as the user declining consent.
 *
 * The framework would otherwise respond with an empty `202 Accepted`
 * body, which looks broken. This helper is intentionally self-contained:
 * no external assets, no script, so it renders identically regardless
 * of where the runtime serves the callback from.
 */
export declare function buildAuthorizationCompletePage(outcome: keyof typeof PAGES): Response;
export {};
