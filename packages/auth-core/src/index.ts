/**
 * Barrel re-export for `@tarima/auth-core`. The package publishes three
 * narrow subpath entry points (`./otp`, `./rate-limit`, `./session`); this
 * file exists only so importers can `import` from the package root in
 * quick scripts without bundling every helper into a single transitive
 * dependency. App wiring should still use the subpath form.
 */
export * as Otp from "./otp.js";
export * as RateLimit from "./rate-limit.js";
export * as Session from "./session.js";
