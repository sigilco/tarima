/**
 * Observer link contracts for the negotiation room.
 *
 * Implements the Brioso share-token pattern:
 * - 192-bit opaque random token (24 bytes hex = 48 chars)
 * - Room / project scoped grant
 * - Observer has read-only access (mutations denied)
 * - 7-day default expiry with re-mint support
 * - Token revocation
 */
import * as v from "valibot";
import { entitySchema } from "./project.js";

/**
 * 24 random bytes hex = 48 characters string.
 */
export const shareTokenSchema = v.pipe(
  v.string(),
  v.regex(/^[a-f0-9]{48}$/, "Token must be a 48-character hex string"),
);

/**
 * The stored observer link record on the wire.
 */
export const observerLinkSchema = v.object({
  id: v.string(),
  projectId: v.string(),
  roomId: v.nullable(v.string()),
  token: shareTokenSchema,
  shareUrl: v.string(),
  createdBy: v.nullable(v.string()),
  createdAt: v.number(),
  expiresAt: v.nullable(v.number()),
  revokedAt: v.nullable(v.number()),
  viewCount: v.number(),
  lastViewedAt: v.nullable(v.number()),
});

export type ObserverLink = v.InferOutput<typeof observerLinkSchema>;

/**
 * Owner request to mint or retrieve a live link.
 */
export const mintRoomLinkRequestSchema = v.object({
  roomId: v.optional(v.string()),
  ttlDays: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(90))),
});

export type MintRoomLinkRequest = v.InferInput<typeof mintRoomLinkRequestSchema>;

/**
 * Owner response for minting or retrieving a live link.
 */
export const mintRoomLinkResponseSchema = v.object({
  link: observerLinkSchema,
  shareUrl: v.string(),
});

export type MintRoomLinkResponse = v.InferOutput<typeof mintRoomLinkResponseSchema>;

/**
 * Query parameters for resolving room access.
 */
export const resolveRoomQuerySchema = v.object({
  share_token: v.optional(shareTokenSchema),
});

export type ResolveRoomQuery = v.InferInput<typeof resolveRoomQuerySchema>;

/**
 * The read-only room payload returned to observers and owners.
 */
export const resolveRoomResponseSchema = v.object({
  project: v.object({
    id: v.string(),
    name: v.string(),
    description: v.nullable(v.string()),
    stage: v.string(),
    goal: v.record(v.string(), v.unknown()),
  }),
  room: v.object({
    id: v.string(),
    name: v.string(),
    status: v.string(),
    terms: v.optional(v.record(v.string(), v.unknown())),
  }),
  access: v.object({
    role: v.picklist(["owner", "observer"]),
    readOnly: v.boolean(),
    expiresAt: v.nullable(v.number()),
    sharedByName: v.optional(v.nullable(v.string())),
  }),
});

export type ResolveRoomResponse = v.InferOutput<typeof resolveRoomResponseSchema>;

/**
 * Response for revoking an observer link.
 */
export const revokeRoomLinkResponseSchema = v.object({
  ok: v.boolean(),
  revokedAt: v.number(),
});

export type RevokeRoomLinkResponse = v.InferOutput<typeof revokeRoomLinkResponseSchema>;

/**
 * Canonical URL helper for the observer link.
 */
export function roomObserverUrl(origin: string, projectId: string, token: string): string {
  const cleanOrigin = origin.replace(/\/+$/, "");
  return `${cleanOrigin}/app/p/${encodeURIComponent(projectId)}/room?share_token=${encodeURIComponent(token)}`;
}

/**
 * The post-teardown observer surface (SP7 removed the negotiation room;
 * the link now opens a read-only project view at /app/o/:projectId).
 *
 * Additive to the frozen room payloads above: `resolveRoomResponseSchema`
 * keeps its room shape for the dormant deal tables, while this schema is
 * what the live observer endpoint actually returns — the project, its
 * board entities, and the observer access block.
 */
export const observerViewResponseSchema = v.object({
  project: v.object({
    id: v.string(),
    name: v.string(),
    stage: v.string(),
    goal: v.record(v.string(), v.unknown()),
  }),
  entities: v.array(entitySchema),
  access: v.object({
    role: v.literal("observer"),
    readOnly: v.literal(true),
    expiresAt: v.nullable(v.number()),
    sharedByName: v.optional(v.nullable(v.string())),
  }),
});

export type ObserverViewResponse = v.InferOutput<typeof observerViewResponseSchema>;

/**
 * Canonical URL helper for the observer link on the new workspace.
 */
export function projectObserverUrl(origin: string, projectId: string, token: string): string {
  const cleanOrigin = origin.replace(/\/+$/, "");
  return `${cleanOrigin}/app/o/${encodeURIComponent(projectId)}?share_token=${encodeURIComponent(token)}`;
}
