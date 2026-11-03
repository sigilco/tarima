# Design Doc: Read-Only Observer Link for Tarima Negotiation Room

## 1. Context & Motivation

Tarima is an operations agent for event organisers managing venue and sponsor chases. During negotiation, when a venue responds with proposed terms, the agent audits them against the organizer's brief, drafts a counter-offer, and requests human approval.

Later in the lifecycle, external stakeholders (such as a client delegate from an agency, a sponsor representative, or the venue owner) need to observe this negotiation room in real time without possessing authority to mutate terms, approve counter-offers, or trigger agent actions.

This document designs and specifies the access layer for the read-only observer link, ported from the pattern established in Brioso.

---

## 2. Brioso to Tarima Port Map

| Brioso Source File & Lines | Tarima Destination File & Lines | Port Notes & Adaptations |
| :--- | :--- | :--- |
| `packages/sharing/src/token.ts:1-7` (`mintShareToken`) | `apps/api/src/services/room-share.ts:29-31` (`mintShareToken`) | 192-bit cryptographic random hex token (`randomBytes(24).toString("hex")`, 48 chars). |
| `packages/sharing/src/types.ts:1-14` (`ShareLink`) | `packages/contract/src/observer-link.ts:24-37` (`observerLinkSchema`) | Stored token contract schema using Valibot; carries id, projectId, roomId, shareUrl, expiresAt, revokedAt, viewCount. |
| `packages/sharing/src/urls.ts:15-27` (`spaceUrls`) | `packages/contract/src/observer-link.ts:98-101` (`roomObserverUrl`) | Canonical URL shape `/app/p/{projectId}/room?share_token={hex}`. Idempotent route on the same resource path. |
| `packages/db/src/schema.ts:665-683` (`share_links`) | `apps/api/src/db/schema.ts:416-435` (`room_share_links`) + `apps/api/drizzle/0007_room_share_links.sql:1-17` | SQLite schema with foreign key cascade to `projects.id`, user relation to `users.id`, unique index on `token`, and index on `project_id`. Mirrored in `apps/api/src/db/index.ts` `BOOTSTRAP_DDL`. |
| `packages/sharing/src/store.ts:50-57, 76-84, 88-103, 121-128` | `apps/api/src/services/room-share.ts:48-163` | `getOrCreateRoomShareLink` (idempotent, 1 live link per project room), `resolveRoomShareToken`, `revokeRoomShareLink`, `incrementRoomViewCount`. |
| `packages/auth-core/src/gate.ts:12-16, 93-105, 124-203, 235-262` | `apps/api/src/middleware/require-room-access.ts:21-147` | Seam classifying callers into `RoomActor` (`session` owner vs `share-token` observer vs `anonymous`). Resource-scoped match, anti-probing rules, sha256 audit projection. |
| `apps/web/src/server/jobs/gates.ts:60-100` & `apps/web/plugins/gate-middleware.ts:40-100` | `apps/api/src/routes/room.ts:43-128` & `apps/api/src/routes/events.ts:39-86` | Owner-only write endpoints (`POST`/`DELETE` room-link), read-only observer endpoints (`GET /room`, `GET /events`). |
| `packages/jobs/src/thread-access.ts:89-140` | `apps/api/src/routes/room.ts:83-127` & `apps/api/src/services/room-share.ts:169-204` | Read endpoint honoring token; PII redaction (email masked, owner identity restricted to display name). |
| `packages/ui/src/components/ShareDialog.tsx:26-68` | `apps/web/src/components/ShareRoomModal.tsx:1-140` | Owner modal to mint, copy, and revoke observer link with 7-day expiration disclaimer. |
| `packages/verticals/studio/src/components/ShareRecipientBanner.tsx:24-71` | `apps/web/src/components/ShareRecipientBanner.tsx:1-48` | Recipient banner indicating who shared the room and displaying read-only observer status. |
| `packages/verticals/studio/src/server/share-link-fn.ts:30-85` | `apps/web/src/lib/api-server.ts:159-170` (`fetchRoomFn`) & `apps/api/src/routes/room.ts:43-71` | Server functions and owner-gated link minting RPC. |

---

## 3. Security Properties & Architecture

### Stored Opaque Token (Not Stateless HMAC / Signed URL)
Tokens are 192-bit cryptographically secure random values (24 bytes hex, 48 characters) stored in the `room_share_links` table. Unlike stateless HMAC signed URLs, stored tokens can be revoked immediately on demand, track page view counts, and allow auditing without revealing signing keys.

### Strict Resource Scoping
The token is scoped directly to a specific `project_id` (and optional `room_id`). During resolution in `resolveRoomShareToken`, the database verifies `row.projectId === projectId`. Prefix matching is prohibited; a token minted for Project A can never access Project B.

### Anti-Probing Defense
To prevent token scanning or project discovery:
1. Invalid tokens, expired tokens, revoked tokens, or tokens presented against a mismatched `projectId` all uniformly return HTTP 401 (`{"error":"unauthorized"}`). The server never emits a distinct 403 or 404 for "valid token, wrong project", which would confirm the token exists elsewhere.
2. Authenticated session callers who do not own the target project receive HTTP 404 (`{"error":"not_found"}`). This prevents authenticated users from probing project IDs.

### Token Expiration & Re-Minting Justification
Brioso music generation links do not expire by default because music assets remain permanently playable. In contrast, venue negotiations are inherently time-bounded (venue holds, quote validity windows, and counter-offers typically expire within 48 hours to 7 days).
Tarima applies a default TTL of 7 days (`DEFAULT_ROOM_LINK_TTL_MS = 7 * 86_400_000`). If a negotiation extends beyond 7 days or a hold expires, the link ceases resolving, and the organizer can idempotently mint a fresh link with one click.

### Immediate Revocation
Organizers can immediately revoke an active link via `DELETE /api/ui/projects/:projectId/room-link`. The database sets `revoked_at = Date.now()`. All subsequent read requests using that token fail immediately with 401.

### Audit Trail (Zero Raw Token Storage)
When auditing room views or actions, the system projects the actor identity using `auditActorFields()`. For `share-token` actors, the identifier is recorded as `sha256:{hash}` using the first 12 hex characters of the SHA-256 hash. The raw 48-character token is never written to log lines, audit tables, or response headers.

### Live Updates (EventSource SSE)
EventSource in standard web browsers cannot attach custom HTTP Authorization headers, but it does carry query parameters. The SSE endpoint `GET /api/ui/projects/:projectId/events?share_token=` validates the token via `requireRoomAccess({ mode: "read", allowObserver: true })`, granting observers live real-time updates as proposals and counter-offers evolve.

### Observer PII Redaction
Observers receive filtered negotiation payloads:
- Owner email addresses are masked (e.g. `s***@example.com`).
- Internal workflow states and private session cookies are excluded.
- The observer banner displays the organizer display name without leaking personal credentials.

---

## 4. API Surface

### 1. `POST /api/ui/projects/:projectId/room-link`
- **Auth**: Owner session cookie (`tarima_session`).
- **Body** (optional): `{ "roomId"?: string, "ttlDays"?: number }`.
- **Response** (201):
  ```json
  {
    "link": {
      "id": "uuid",
      "projectId": "uuid",
      "roomId": null,
      "token": "48-char-hex",
      "shareUrl": "https://.../app/p/{projectId}/room?share_token={token}",
      "createdBy": "user-id",
      "createdAt": 1793350000000,
      "expiresAt": 1793954800000,
      "revokedAt": null,
      "viewCount": 0,
      "lastViewedAt": null
    },
    "shareUrl": "https://.../app/p/{projectId}/room?share_token={token}"
  }
  ```
- **Behavior**: Idempotent. Returns the active live link if one already exists.

### 2. `DELETE /api/ui/projects/:projectId/room-link`
- **Auth**: Owner session cookie (`tarima_session`).
- **Response** (200):
  ```json
  {
    "ok": true,
    "revokedAt": 1793350100000
  }
  ```
- **Behavior**: Marks active links for the project as revoked (`revoked_at = now`).

### 3. `GET /api/ui/projects/:projectId/room?share_token={token}`
- **Auth**: Owner session cookie OR `share_token` query parameter / `X-Share-Token` header.
- **Response** (200):
  ```json
  {
    "project": {
      "id": "uuid",
      "name": "Annual Summit 2026",
      "description": null,
      "stage": "curate",
      "goal": { ... }
    },
    "room": {
      "id": "default",
      "name": "Negotiation Room",
      "status": "curate",
      "terms": {
        "venueName": "The Grand Hall",
        "brief": { ... },
        "status": "curate"
      }
    },
    "access": {
      "role": "observer",
      "readOnly": true,
      "expiresAt": null,
      "sharedByName": "Sarah Organizer"
    }
  }
  ```
- **Behavior**: Increments `view_count` on the link. Redacts owner PII when `role === "observer"`.

### 4. `GET /api/ui/projects/:projectId/events?share_token={token}`
- **Auth**: Owner session cookie OR `share_token` query parameter.
- **Protocol**: `text/event-stream` (Server-Sent Events).
- **Behavior**: Streams real-time negotiation audit events to both organizers and authorized observers.

---

## 5. Web Surface Prototype

- **Route**: `/app/p/$projectId/room?share_token={token}` (implemented in `apps/web/src/routes/app/p/$projectId_.room.tsx`).
- **Banner**: `ShareRecipientBanner.tsx` displays the organizer attribution and observer status badge.
- **Owner Modal**: `ShareRoomModal.tsx` provides copy link, status, and revocation actions directly from the project board header.
- **Read-Only Rendering**: Renders event brief, current negotiation terms, and live connection status. Mutating action buttons (such as counter-offer approval, stage advances, or entity edits) are completely absent.

---

## 6. Open Questions & Future Considerations

1. **Multiple Rooms per Project**:
   The current data model supports `room_id` (nullable, defaulting to `"default"`). When Tarima adds parallel negotiations with multiple competing venues on the same board, `room_id` can be populated with the specific venue entity id to scope observer links to a single venue's negotiation thread.
2. **Observer Feedback Channel**:
   Can read-only observers leave non-binding emoji reactions or advisory comments for the organizer? Current implementation enforces strict read-only mode at the HTTP layer; adding comments would require a distinct `observer-comment` capability.
3. **Webhook Notifications on View**:
   Should the organizer receive a Telegram or WhatsApp notification when a client delegate or venue owner opens the link for the first time? The `view_count` increment in `services/room-share.ts` provides the exact seam to trigger a notification event if desired.
