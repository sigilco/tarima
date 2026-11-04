# Deploy pipeline gotchas (2026-11-04)

The prod deploy runs from CI: the build job assembles the artifact, the deploy job
ships it and runs one sudoers-allowed command on the box.

```
sudo /usr/local/sbin/tarima-deploy '<sha>'
```

## Layout

- `/opt/tarima2/releases/<sha>/{dist/server,node_modules,package.json}`
- `/opt/tarima2/current` -> `releases/<sha>` (the symlink the deploy flips)
- `/opt/tarima2/shared/deployed-sha` (the sha currently serving)
- `/usr/local/sbin/tarima-deploy` (root-owned, outside the repo checkout)

## Things that cost time

- The sudoers target must live outside the repo checkout. It used to be
  `/opt/tarima2/repo/deploy/scripts/deploy-vps.sh`, which CI owned, so CI could edit
  the script it sudo-ran. It is now root-owned at a fixed path.
- The artifact is self-contained (`pnpm deploy --prod --legacy`, about 190M). The box
  installs nothing, so a runtime dependency can never be missing at boot.
- The post-deploy check must hit `/` as well as `/api/health`. A broken SSR bundle
  (missing `valibot` in `node_modules`) left `/api/health` at 200 while `/` was 500.
- The CI boot smoke hung forever: importing the artifact starts a listener, so the
  process never exits. It needs an explicit `process.exit(0)`.
- Parsing the result line with a greedy `sed 's/.*sha=\([^ ]*\).*/\1/p'` also matches
  the sha inside `prev_sha=`, so the summary named the wrong commit. Match on a word
  boundary.
- The artifact path must be named after the sha (`/tmp/tarima-artifact-<sha>.tar.zst`).
  A fixed path collides with a leftover file from an earlier deploy, and the upload
  fails with a permission error.
- macOS `mv` has no `-T`, and BSD `mv` moves a symlink *into* the directory it points
  at. The symlink flip needs a GNU and a BSD branch.
- `chown user:group` fails when the group name differs from the user name. Look the
  group up with `id -gn`.

## Checks before pushing

```
mise run deploy:lint    # shellcheck the host scripts
mise run deploy:test    # drive the script against a temp root
mise run deploy:dry     # one dry run against a temp root
```

The rollback drill (deploy an artifact that passes verification but does not serve)
must leave the previous release serving and print `status=failed`.
