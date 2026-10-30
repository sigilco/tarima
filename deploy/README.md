# Deploy

One Node process serves the API and the web app.

- Artifact: `apps/api/dist/server/` (API bundle + web SSR and client builds).
- Runtime: `tarima.service`, WorkingDirectory `/opt/tarima/app`, env from
  `/opt/tarima/shared/app.env`, port 3001 on loopback.
- TLS: Caddy (see `caddy/Caddyfile`) proxies the public domains.
- Backups: `tarima-litestream.service` replicates the SQLite WAL to R2.

Secrets: `secrets-manifest.toml` + `scripts/render_secrets.py` render
`app.env` (Infisical folders `email/`, `ai/`, `beta/`, `webhooks/` and
`channels/`) and `litestream.env` (`infra/litestream/`), mode 0600,
fail-hard on missing keys. Validate with
`python3 deploy/scripts/validate_secrets_manifest.py`.

First run of `deploy.sh`: see the header comment in `deploy/deploy.sh` for
the one-time VPS provisioning steps (user, directories, systemd + Caddy
install, Infisical machine-identity login).

## The public domain

Every URL below uses `PUBLIC_DOMAIN`, a variable with two values:

- now: `tarima.illo.fyi` (staging, what testers hit on Monday)
- later: `tarima.events` (production, when the domain is ready)

Replace `$PUBLIC_DOMAIN` in the commands with the one in play. To move from
one to the other: add the new name to `deploy/caddy/Caddyfile`, point its
DNS at the VPS, set `API_BASE` in `apps/inbound-worker/wrangler.jsonc` to
the new origin, redeploy the worker, update the WhatsApp webhook URL in
the Meta dashboard, then `systemctl reload caddy`. Nothing else hardcodes
the domain: the API is origin agnostic.

## Deploy steps

On the laptop (the script builds, renders, uploads, restarts and health
checks; run it manually, the repo never deploys by itself):

    pnpm build
    ./deploy/deploy.sh

The script uses `VPS_HOST` (default `ovhcloud`) and prints each step. After
it prints `deployed`, run the smoke test:

    scripts/smoke.sh https://$PUBLIC_DOMAIN tester@illo.fyi

## Real email (Brevo in, replies through Cloudflare)

Outbound:

1. In Brevo, verify the prod sender (`MAIL_FROM` in Infisical `/email`)
   and keep the API key in the same folder.
2. The API posts to Brevo when `BREVO_API_KEY` is set and the recipient is
   not on a loopback domain (`EMAIL_LOOPBACK_DOMAINS` in app.env).
3. Test: request an OTP from the login page for a real address and confirm
   the mail arrives from the prod sender.

Inbound (the chase reply path):

1. The Cloudflare Email Worker (`apps/inbound-worker`) posts every inbound
   chase mail to `POST /webhooks/email` with the header
   `X-Webhook-Secret: <INBOUND_WEBHOOK_SECRET>`.
2. Deploy it: `pnpm -C apps/inbound-worker exec wrangler secret put
   INBOUND_WEBHOOK_SECRET`, then `pnpm -C apps/inbound-worker exec wrangler
   deploy`. `API_BASE` in `wrangler.jsonc` must be the public origin.
3. In the Cloudflare dashboard, on the zone matching the subdomain used
   for chase replies (e.g. `venue@$PUBLIC_DOMAIN`), enable Email Routing
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
   the callback URL to `https://$PUBLIC_DOMAIN/webhooks/whatsapp` and the
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
   process and is a no-op without the token.
3. Test: a tester opens `/app/settings`, mints a connect code, sends it to
   the bot, and the bot confirms the binding in chat.

## Litestream replication check

The unit runs `litestream replicate` against R2 with credentials from
`litestream.env`. After the first deploy:

    systemctl status tarima-litestream        # active, no restart loop
    litestream replicas -config /opt/tarima/app/deploy/litestream/litestream.yml

The replicas output must show the R2 replica with a recent generation and
non-zero lag-free sync. In the Cloudflare R2 dashboard the `tarima-backups`
bucket must show objects under `litestream/` newer than the deploy. Never
point at a bucket with a lifecycle delete rule.

## One-command rollback

`deploy/deploy.sh` snapshots the running artifact on the VPS before it
uploads the new one, so the rollback is exactly one command over ssh:

    ssh $VPS_HOST 'rm -rf /opt/tarima/app/dist/server && cp -a /opt/tarima/app/dist/server.previous /opt/tarima/app/dist/server && sudo systemctl restart tarima.service'

The snapshot lives at `/opt/tarima/app/dist/server.previous` (the copy the
deploy script makes with `cp -a` right before the rsync). A rsync form
works too when the previous artifact was uploaded from a laptop:

    rsync -az --delete ./apps/api/dist/server.previous/ $VPS_HOST:/opt/tarima/app/dist/server/

Database restores go through Litestream, not rsync: stop the services,
then `litestream restore -o /opt/tarima/shared/data/tarima.db
s3://tarima-backups/litestream` and start them again.

## Operator checklist (human, after deploy.sh is green)

- [ ] Infisical folders exist and are non-empty: `/email`, `/ai`,
      `/infra/litestream`, `/beta`, `/webhooks`, `/channels` (names in
      `secrets-manifest.toml`).
- [ ] `BETA_ALLOWLIST` lists the tester emails (comma separated).
- [ ] `SESSION_SECRET` is a long random string, not the dev default.
- [ ] DNS for `$PUBLIC_DOMAIN` points at the VPS; Caddy obtained a
      certificate (`systemctl status caddy`, hit
      `https://$PUBLIC_DOMAIN/api/health`).
- [ ] Brevo sender verified and a real OTP mail received.
- [ ] Cloudflare Email Routing catch-all routes to the `tarima-email`
      worker; a reply lands in the engine.
- [ ] WhatsApp webhook verified and subscribed; a test phone connected
      through the settings page.
- [ ] Telegram bot token set; a connect code bound a chat.
- [ ] Litestream replicas show a fresh R2 generation.
- [ ] `scripts/smoke.sh https://$PUBLIC_DOMAIN <allowlisted email>` green.
- [ ] Rollback path rehearsed once: `dist/server.previous` exists on the
      VPS and the restore command above completes.
