# Deploy

One Node process serves the API and the web app.

- Artifact: `apps/api/dist/server/` (API bundle + web SSR and client builds).
- Runtime: `tarima.service`, WorkingDirectory `/opt/tarima/app`, env from
  `/opt/tarima/shared/app.env`, port 3001 on loopback.
- TLS: Caddy (see `caddy/Caddyfile`) proxies tarima.events / tarima.illo.fyi.
- Backups: `tarima-litestream.service` replicates the SQLite WAL to R2.

Secrets: `secrets-manifest.toml` + `scripts/render_secrets.py` render
`app.env` (Infisical folders `email/` and `ai/`) and `litestream.env`,
mode 0600, fail-hard on missing keys. Validate with
`python3 deploy/scripts/validate_secrets_manifest.py`.

First run of `deploy.sh`: see the header comment in `deploy/deploy.sh` for
the one-time VPS provisioning steps (user, directories, systemd + Caddy
install, Infisical machine-identity login).
