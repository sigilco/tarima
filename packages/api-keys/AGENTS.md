# @tarima/api-keys

Pure key lifecycle for machine consumers: scrypt hashing, the `tarima_<prefix>_<secret>` plaintext format, a storage seam (`ApiKeyStore`) and a verifier (`verifyApiKey`) that turns a plaintext bearer token into the owning user plus its scopes.

## Rules

- MUST stay pure: no I/O, no database code, no `process.env`, no clock reads hidden in defaults. The api app binds the store to the `api_keys` table; tests bind it to a Map.
- NEVER import from `@tarima/contract`, `@tarima/obs`, the api app, or any drizzle code. This package is a leaf alongside `@tarima/auth-core`.
- The plaintext key is returned exactly once at creation and never persisted. Only the scrypt hash and the lookup prefix reach storage.
- Secrets are compared in constant time (`timingSafeEqual`); never compare hashes with `===`.

## Exports

- `.`: `generateApiKey`, `hashApiKey`, `compareApiKey`, `splitApiKey`, `verifyApiKeyFormat`, `API_KEY_PREFIX`, `ApiKeyRecord`, `createKeyStore`, `createMemoryStore`, `verifyApiKey`, `ApiKeyStore`, `VerifiedKey`.

## Testing

Vitest, catalog version. Tests live next to the code as `*.test.ts`. Cover key shape, hash round-trip, wrong secret, unknown prefix, revoked key.
