# @tarima/inbound-worker

Cloudflare Email Worker that bridges illo.fyi mail into the Tarima api.

## Flow

```
sender replies to <row>@tarima.illo.fyi
  -> Cloudflare Email Routing (illo.fyi, catch-all rule bound to this worker)
  -> worker `email` handler (filters @tarima.illo.fyi recipients)
  -> POST {API_BASE}/webhooks/email   {raw, to, from}  + X-Webhook-Secret
  -> api parses the MIME, attaches the message to the chase run,
     enqueues the chase.parse step
```

## Env

| name | kind | notes |
| --- | --- | --- |
| `API_BASE` | wrangler var | public api base url, e.g. `https://tarima.events` |
| `INBOUND_WEBHOOK_SECRET` | wrangler secret | must match the api's `INBOUND_WEBHOOK_SECRET` |

Secrets never live in `wrangler.jsonc`:

```sh
pnpm -C apps/inbound-worker exec wrangler secret put INBOUND_WEBHOOK_SECRET
```

## Deploy

The worker is deployed by wrangler, independently of the api artifact
(`apps/api` never bundles this app; CI auto-deploys on push via the
Cloudflare integration already bound to the `tarima-email` worker):

```sh
pnpm -C apps/inbound-worker deploy
```

Local dev against a running api (`wrangler dev` cannot receive real
mail; use it for the fetch handler only):

```sh
pnpm -C apps/inbound-worker dev
```

## One-time manual step

After the first deploy, in the Cloudflare dashboard: illo.fyi Email
Routing -> catch-all rule (`*@tarima.illo.fyi`) -> action "Send to a
Worker" -> `tarima-email`.

`wrangler` is a devDependency of this app (pinned to the 4.x line) so
`pnpm -C apps/inbound-worker deploy` works from a clean checkout.
