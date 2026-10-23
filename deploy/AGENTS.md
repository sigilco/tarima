# Deploy

Deployment skeleton for the tarima VPS (alias `ovhcloud`).

- Scripts prepare but never deploy by themselves unless invoked by a human.
- Secrets render from Infisical to `/opt/tarima/shared/*.env`, mode 0600. Never commit rendered env files or real secrets.
- Reference deployment patterns live in the brioso repo (`deploy/`), which is read-only.
- Validate the manifest with `python3 deploy/scripts/validate_secrets_manifest.py` after editing `deploy/secrets-manifest.toml`. Static keys must not overlap Infisical keys inside a key_set.
- pnpm only. Conventional commits, no co-author trailers, no emdashes in prose.
