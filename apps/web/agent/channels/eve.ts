import { eveChannel } from "eve/channels/eve";
import { UnauthenticatedError, type AuthFn } from "eve/channels/auth";
import { readSessionCookie, verifySessionToken } from "@tarima/auth-core/session";

/**
 * Tarima route auth: the `tarima_session` HMAC cookie minted by
 * @tarima/auth-core/session verifies to a users.id, which becomes the
 * eve principal. A missing or invalid cookie rejects with 401 — there
 * is no anonymous fallback on this surface.
 */
const tarimaSession: AuthFn<Request> = (request) => {
  const token = readSessionCookie(request);
  const verified = token
    ? verifySessionToken(token, process.env.SESSION_SECRET ?? "dev-insecure-session-secret")
    : undefined;
  if (!verified) {
    throw new UnauthenticatedError({
      code: "authentication_required",
      message: "Sign in to tarima to use the agent.",
    });
  }
  return {
    authenticator: "tarima-session",
    principalId: verified.userId,
    principalType: "user",
    attributes: {},
  };
};

export default eveChannel({
  auth: [tarimaSession],
});
