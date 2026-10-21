# @tarima/channels

Owns the ChannelAdapter contract, the tag to adapter router, and one adapter
per outbound channel (email loopback/Brevo/file, WhatsApp Cloud API) plus the
shared inbound helpers (MIME parsing, HTML to text, attachment store, raw
body caching for webhook signature checks).

Must never import: any app (`apps/*`), any db schema or drizzle code, any
node-only server framework (hono/express/fastify), or `@tarima/contract`
(contract is the innermost leaf and imports flow toward it, never away).
Persistence is injected through narrow seams (`LoopbackSink`, `FileOutbox`,
`AttachmentStore`) that the api app binds to real tables and directories.
Exports are narrow: only names listed in src/index.ts. Adapter `send` never
throws on a provider refusal; it returns `{accepted:false, reason}` and the
outbox dispatcher decides retry vs dead-letter.
