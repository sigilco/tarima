# Deploy

One Node process serves the API and the web app.

- Artifact: `apps/api/dist/server/` (API bundle + web SSR and client builds).
- Runtime: `tarima.service`, WorkingDirectory `/opt/tarima2/app`, env from
  `/opt/tarima2/shared/app.env`, port 3001 on loopback.
- TLS: Caddy (see `deploy/caddy/Caddyfile`) reverse proxies ports 80 and 443 to port 3001.
  - Active: `https://37.187.62.157` (public IP, internal TLS) and `https://100.105.198.36` (Tailscale IP, internal TLS).
  - Ready for Public CA: `tarima.events` and `tarima.illo.fyi` once DNS A records point to `37.187.62.157`.
- Backups: `tarima-litestream.service` replicates the SQLite WAL to R2 (pending R2 credentials).

Secrets: `secrets-manifest.toml` + `scripts/render_secrets.py` render
`app.env` (Infisical folders `email/`, `ai/`, `beta/`, `webhooks/` and
`channels/`) and `litestream.env` (`infra/litestream/`), mode 0600,
fail-hard on missing keys. Validate with
`python3 deploy/scripts/validate_secrets_manifest.py`.

The laptop infisical CLI renders the secrets (`render_secrets.py --phase base`) and `deploy.sh` uploads them to `/opt/tarima2/shared/` mode 0600 owned by `web-services:web-services`.

## Active Endpoints and Ports

- Internal Node app: `127.0.0.1:3001`
- Bifrost LLM gateway: `127.0.0.1:8317` (model `minimax-coding-plan/MiniMax-M3.1-Flash`)
- Public HTTPS: `https://37.187.62.157/` (Caddy reverse proxy with internal TLS)
- Public HTTP: `http://37.187.62.157/` (Caddy 308 redirect to HTTPS)
- Tailscale HTTPS: `https://100.105.198.36/` (Caddy internal TLS)

## Deploy steps

On the laptop (the script builds, renders, uploads, restarts and health checks; run it manually, the repo never deploys by itself):

```bash
mise exec -- pnpm build
./deploy/deploy.sh
```

The script uses `VPS_HOST` (default `ovhcloud`) and prints each step. After
it prints `deployed`, run the smoke test:

```bash
scripts/smoke.sh https://37.187.62.157 tester@illo.fyi
```

## Real email (Brevo in, replies through Cloudflare)

Outbound:

1. In Brevo, verify the prod sender (`MAIL_FROM` in Infisical `/email`)
   and keep the API key in the same folder.
2. The API posts to Brevo when `BREVO_API_KEY` is set and the recipient is
   not on a loopback domain (`EMAIL_LOOPBACK_DOMAINS` in `app.env`).
3. **Brevo IP Whitelist**: Brevo requires adding the VPS IP (`37.187.62.157` / `2001:41d0:52:200::763`)
   in [Brevo Authorized IPs](https://app.brevo.com/security/authorised_ips).
4. Test: request an OTP from the login page for a real address and confirm
   the mail arrives from the prod sender.

Inbound (the chase reply path):

1. The Cloudflare Email Worker (`apps/inbound-worker`) posts every inbound
   chase mail to `POST /webhooks/email` with the header
   `X-Webhook-Secret: <INBOUND_WEBHOOK_SECRET>`.
2. Deploy it: `pnpm -C apps/inbound-worker exec wrangler secret put INBOUND_WEBHOOK_SECRET`, then `pnpm -C apps/inbound-worker exec wrangler deploy`. `API_BASE` in `wrangler.jsonc` must be the public origin.
3. In the Cloudflare dashboard, on the zone matching the subdomain used
   for chase replies (e.g. `venue@tarima.illo.fyi`), enable Email Routing
   and set a catch-all rule with action "Send to Worker" pointing at
   `tarima-email`.
4. `INBOUND_WEBHOOK_SECRET` must hold the same value in Infisical
   `/webhooks` and in the worker secret; the API answers 401 otherwise.
5. Test: reply to a chase mail from the venue inbox and confirm the reply
   lands in the engine (an `outreach_messages` row with direction
   `inbound`, and a `chase.parse` step in the run journal).

## WhatsApp webhook (Meta Cloud API)

1. Values come from Meta App Dashboard, WhatsApp, API Setup: test number,
   phone number id, temporary access token, and App Settings, Basic, App
   Secret. They live in Infisical `/channels` as `WHATSAPP_TOKEN`,
   `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_APP_SECRET`. `WHATSAPP_VERIFY_TOKEN`
   is a random string the operator picks, not a Meta value.
2. Webhook subscription: in the dashboard, WhatsApp, Configuration, set
   the callback URL to `https://<PUBLIC_DOMAIN>/webhooks/whatsapp` and the
   verify token to the same `WHATSAPP_VERIFY_TOKEN`. Meta sends
   `GET /webhooks/whatsapp` with `hub.mode=subscribe` and echoes
   `hub.challenge` when the token matches.
3. Subscribe to the `messages` field. Meta then posts events to the same
   URL with an `X-Hub-Signature-256` HMAC over the raw body keyed with
   `WHATSAPP_APP_SECRET`; the API answers 401 on a bad signature.
4. Test recipients: add each tester phone under API Setup, To (test
   numbers allow 5). The tester must message the number first; the
   connect code from `/app/settings` binds the number and opens the 24h
   window. Temporary access tokens expire every 24h in dev.
5. Verify both directions: a `GET ...?hub.mode=subscribe&hub.verify_token=...`
   curl returns the challenge, and a signed POST (a real "hi" from a test
   phone) creates a `channel_bindings` row.

## Telegram bot

1. BotFather: create the bot, take the token, store it in Infisical
   `/channels` as `TELEGRAM_BOT_TOKEN`.
2. The bot long-polls (no public webhook needed); it starts with the API
   process and is active as `@tarima_events_bot`.
3. Test: a tester opens `/app/settings`, mints a connect code, sends it to
   the bot, and the bot confirms the binding in chat.

## Litestream replication check

The unit runs `litestream replicate` against R2 with credentials from
`litestream.env`. Once real R2 credentials are added to Infisical `/infra/litestream`:

```bash
sudo systemctl enable --now tarima-litestream.service
sudo systemctl status tarima-litestream
litestream status -config /opt/tarima2/app/deploy/litestream/litestream.yml
```

The status output must show the replica synced with a recent lag. In the
Cloudflare R2 dashboard the `tarima-backups` bucket must show objects
under `litestream/` newer than the deploy. Never point at a bucket with a
lifecycle delete rule.

## One-command rollback

`deploy/deploy.sh` snapshots the running artifact on the VPS before it
uploads the new one, so the rollback is exactly one command over ssh:

```bash
ssh $VPS_HOST 'rm -rf /opt/tarima2/app/dist/server && cp -a /opt/tarima2/app/dist/server.previous /opt/tarima2/app/dist/server && sudo systemctl restart tarima.service'
```

The snapshot lives at `/opt/tarima2/app/dist/server.previous`.

Database restores go through Litestream, not rsync: stop the services,
then `litestream restore -o /opt/tarima2/shared/data/tarima.db s3://tarima-backups/litestream` and start them again.

## Operator checklist (human, after deploy.sh is green)

- [x] Infisical folders exist: `/email`, `/ai`, `/infra/litestream`, `/beta`, `/webhooks`, `/channels`.
- [x] `BETA_ALLOWLIST` and `SESSION_SECRET` generated and configured.
- [x] `LLM_BASE_URL` (Bifrost `http://127.0.0.1:8317/v1`) and `LLM_API_KEY` wired to Bifrost.
- [ ] Add VPS IPs (`37.187.62.157`, `2001:41d0:52:200::763`) to [Brevo Authorized IPs](https://app.brevo.com/security/authorised_ips).
- [ ] DNS: Configure A record for `tarima.illo.fyi` or `tarima.events` pointing to `37.187.62.157`. Once active, uncomment domain block in `/etc/caddy/Caddyfile` and `sudo systemctl reload caddy`.
- [ ] Inbound email worker: deploy `apps/inbound-worker` to Cloudflare and wire Email Routing catch-all rule on `illo.fyi`.
- [ ] Meta/WhatsApp Cloud API: configure webhook callback and put credentials in Infisical `/channels`.
- [ ] Cloudflare R2: create `tarima-backups` bucket and configure `S3_ACCESS_KEY` / `S3_SECRET_KEY` in Infisical `/infra/litestream`.
