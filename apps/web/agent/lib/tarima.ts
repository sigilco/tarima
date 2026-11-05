/**
 * Shared plumbing for the eve agent tools: the drizzle db and the
 * calling user's id, read from the session auth eve stamped onto the
 * session (`channels/eve.ts` put users.id there).
 */
import { db } from "@tarima/api/db";

type AuthedContext = {
  session: { auth: { current: { principalId: string } | null } };
};

/** The tarima user id behind the current agent session, or undefined. */
export function callerUserId(ctx: unknown): string | undefined {
  const current = (ctx as AuthedContext | undefined)?.session?.auth?.current;
  return current?.principalId ?? undefined;
}

export { db };
