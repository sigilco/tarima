/**
 * Beta access. `users.role` is one of USER_ROLES. `BETA_ALLOWLIST` (env,
 * comma separated emails) gates `POST /auth/verify-otp`: when set, an email
 * outside the list is rejected with {@link NOT_ALLOWLISTED_ERROR}; when
 * unset or empty, login stays open.
 */
export const USER_ROLES = ["member", "beta", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const NOT_ALLOWLISTED_ERROR = "not_allowlisted";

/** Parse the env value into lower-cased, de-duplicated emails. */
export function parseAllowlist(raw: string | undefined): string[] {
  if (!raw) return [];
  const emails = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set(emails)];
}

/** True when login is allowed for `email` under the given allowlist env value. */
export function isAllowlisted(raw: string | undefined, email: string): boolean {
  const list = parseAllowlist(raw);
  return list.length === 0 || list.includes(email.trim().toLowerCase());
}
