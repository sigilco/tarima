# SP7 teardown inventory

## Routes (apps/web/src/routes/)
- KEEP `__root.tsx` — root document
- KEEP `index.tsx` — landing page
- KEEP `login.tsx` — session minting
- KEEP `app/index.tsx` — NEW workspace shell project list
- KEEP `app/w/$projectId.tsx` — NEW workspace shell project view
- REMOVE `app/p/$projectId.tsx` — old board (uses BoardHeader, BoardTable, RowModal, CsvModal, AddRowModal, StageBanner, InboxPanel, ShareRoomModal)
- REMOVE `app/p/$projectId_.room.tsx` — old negotiation room (NegotiationRoomView)
- REMOVE `app/settings.tsx` — old settings (uses fetchInboxFn, fetchSettingsFn, connect codes)
- REMOVE `projects/$projectId_.room.tsx` — duplicate room route

## Components (apps/web/src/components/)
- KEEP `workspace/` — WorkspaceShell, Sidebar, ProjectList, ProjectView, ChatPanelSlot
- KEEP `chat/` — ChatPanel, ChatBubble, ChatApproval, ChatToolChip, useChatAgent
- KEEP `landing/` — landing page
- KEEP `auth/`, `ui/`, `ai-elements/` — shared
- REMOVE `AddRowModal.tsx`, `BoardHeader.tsx`, `BoardTable.tsx`, `BriefForm.tsx`, `CsvModal.tsx`, `InboxPanel.tsx`, `NegotiationRoomView.tsx`, `RowModal.tsx`, `ShareRecipientBanner.tsx`, `ShareRoomModal.tsx`, `StageBanner.tsx`

## Lib (apps/web/src/lib/)
- KEEP `api-handlers/` (subset), `api-server.ts`, `api.ts`, `icons.ts`, `seo.ts`, `stores.ts`, `utils.ts`
- REMOVE `board.ts`, `board.test.ts`, `brief.ts`, `brief.test.ts`, `csv-preview.ts`, `csv-preview.test.ts`, `stage.ts`, `stage.test.ts`, `room.test.ts`

## API handlers (apps/web/src/lib/api-handlers/)
- KEEP `access-requests.ts`, `agent-runtime-state.ts`, `agent-turn.ts`, `auth.ts`, `dev-login.ts`, `eve-proxy.ts`, `helpers.ts`, `index.ts`, `runtime.ts`, `projects.ts` (subset), `settings.ts` (subset), `ui.ts` (subset)
- REMOVE `api-keys.ts`, `capabilities.ts` (mcp.ts deferred but capabilities endpoint depends on it — KEEP for now)

## apps/api (Hono server)
- REMOVE entirely (replaced by apps/web/src/lib/api-handlers). The schema (`apps/api/src/db/schema.ts`) must be moved into apps/web so drizzle migrations survive.

## Packages
- KEEP `auth-core`, `channels`, `contract`, `copy`, `eve`, `llm` (used by contract tests), `obs`
- REMOVE `api-keys`, `chase`, `engine`, `room`, `telegram`, `venuesearch`

## Tests
- KEEP `apps/web/tests/turn/`, `apps/web/tests/chat/`
- ADAPT `apps/web/tests/e2e/smoke.spec.ts` — uses old board UI; rewrite to dev-login → create project → chat turn
- REMOVE `tests/e2e/` (api-level chase loop tests — engine is gone)

## CSS
- REMOVE `.grain`, `.reveal`, `.agent-cursor`, `.cell-lit`, `.row-working`, `.pill`, old `@theme` paper/clay block
- KEEP landing's playful scoped styles
