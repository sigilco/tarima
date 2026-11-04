# Deploy

One Node process serves the API and the web app.

- Artifact: a self-contained tree (API bundle + web SSR and client builds +
  `node_modules`), built in CI by `pnpm deploy --prod --legacy` and packed
  into `/tmp/tarima-artifact.tar.zst`.
- Runtime: `tarima.service`, WorkingDirectory `/opt/tarima2/current`, env from
  `/opt/tarima2/shared/app.env`, port 3001 on loopback.
- Layout on the box:
  - `/opt/tarima2/releases/<sha>/{dist/server,node_modules,package.json}`
  - `/opt/tarima2/current` -> `releases/<sha>` (the symlink the deploy flips)
  - `/opt/tarima2/shared/deployed-sha` (the sha currently serving)
- Host script: `/usr/local/sbin/tarima-deploy`, root-owned and outside the
  repo checkout, so CI cannot edit the thing it sudo-runs. The sudoers
  entry allows the `deploy` user to run exactly that one command.
- TLS: Caddy (see `deploy/caddy/Caddyfile`) reverse proxies ports 80 and 443 to port 3001.
  - Active: `https://37.187.62.157` (public IP, internal TLS) and `https://100.105.198.36` (Tailscale IP, internal TLS).
  - Ready for Public CA: `tarima.events` and `tarima.illo.fyi` once DNS A records point to `37.187.62.157`.
- Backups: `tarima-litestream.service` replicates the SQLite WAL to R2 (pending R2 credentials).

Secrets: `secrets-manifest.toml` + `scripts/render_secrets.py` render
`app.env` (Infisical folders `email/`, `ai/`, `beta/`, `webhooks/` and
`channels/`) and `litestream.env` (`infra/litestream/`), mode 0600,
fail-hard on missing keys. Validate with
`python3 deploy/scripts/validate_secrets_manifest.py`.

The laptop infisical CLI renders the secrets (`render_secrets.py --phase base`) and `deploy.sh` uploads them to `/opt/tarima2/shared/` mode 0600 owned by `web-services:web-services`. The code itself is deployed by CI, not by this script.

## Active Endpoints and Ports

- Internal Node app: `127.0.0.1:3001`
- Bifrost LLM gateway: `127.0.0.1:8317` (model `minimax-coding-plan/MiniMax-M3.1-Flash`)
- Public HTTPS: `https://37.187.62.157/` (Caddy reverse proxy with internal TLS)
- Public HTTP: `http://37.187.62.157/` (Caddy 308 redirect to HTTPS)
- Tailscale HTTPS: `https://100.105.198.36/` (Caddy internal TLS)

## Deploy steps

Production deploys run from CI (`.github/workflows/deploy.yml`): the build
job assembles the artifact, the deploy job ships it and runs the one
sudoers-allowed command on the box:

```
sudo /usr/local/sbin/tarima-deploy '<sha>'
```

The script prints exactly one `::DEPLOY_RESULT:: status=ok|failed sha=<sha>
prev_sha=<sha>` line and exits non-zero when the release does not serve,
after rolling back to the previous one.

Host setup (once, from the laptop, as root on the VPS):

```bash
sudo ./deploy/scripts/install-host.sh
```

Local checks, before pushing:

```bash
mise run deploy:lint    # shellcheck the host scripts
mise run deploy:test    # drive the script against a temp root
mise run deploy:dry     # one dry run against a temp root
```

Secrets are rendered on the laptop (`render_secrets.py --phase base`) and
uploaded to `/opt/tarima2/shared/` mode 0600 owned by
`web-services:web-services`. `deploy/deploy.sh` still does the manual
secret upload plus a smoke test:

```bash
scripts/smoke.sh https://tarima.illo.fyi tester@illo.fyi
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

The deploy keeps the last five releases, and `current` is a symlink, so
a rollback is a symlink flip plus a restart:

```bash
ssh $VPS_HOST 'sudo ln -sfn releases/<prev-sha> /opt/tarima2/current.new && sudo mv -T /opt/tarima2/current.new /opt/tarima2/current && sudo systemctl restart tarima.service'
```

The previous sha is the one in `/opt/tarima2/shared/deployed-sha`. The
deploy script does this by itself when the health check fails, so a bad
release never stays up.

Database restores go through Litestream, not rsync: stop the services,
then `litestream restore -o /opt/tarima2/shared/data/tarima.db s3://tarima-backups/litestream` and start them again.

## Operator checklist (human, after a deploy is green)

- [x] Infisical folders exist: `/email`, `/ai`, `/infra/litestream`, `/beta`, `/webhooks`, `/channels`.
- [x] `BETA_ALLOWLIST` and `SESSION_SECRET` generated and configured.
- [x] `LLM_BASE_URL` (Bifrost `http://127.0.0.1:8317/v1`) and `LLM_API_KEY` wired to Bifrost.
- [ ] Add VPS IPs (`37.187.62.157`, `2001:41d0:52:200::763`) to [Brevo Authorized IPs](https://app.brevo.com/security/authorised_ips).
- [ ] DNS: Configure A record for `tarima.illo.fyi` or `tarima.events` pointing to `37.187.62.157`. Once active, uncomment domain block in `/etc/caddy/Caddyfile` and `sudo systemctl reload caddy`.
- [ ] Inbound email worker: deploy `apps/inbound-worker` to Cloudflare and wire Email Routing catch-all rule on `illo.fyi`.
- [ ] Meta/WhatsApp Cloud API: configure webhook callback and put credentials in Infisical `/channels`.
- [ ] Cloudflare R2: create `tarima-backups` bucket and configure `S3_ACCESS_KEY` / `S3_SECRET_KEY` in Infisical `/infra/litestream`.
