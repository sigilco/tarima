# @tarima/eve-vendored

Vendored copy of [`eve` 1.0.0-rc.5](https://github.com/vercel/eve) (Apache-2.0),
extracted from the npm tarball so the monorepo has no runtime npm external for
the agent runtime.

## Source and version

- Package: `eve@1.0.0-rc.5` from npm
- Extracted on: 2026-11-05
- Contents: `dist/` (compiled, self-contained — all AI-SDK providers live
  pre-compiled under `dist/src/compiled/@ai-sdk/*`), `bin/`, `docs/`,
  `LICENSE` (Apache-2.0), `NOTICE`, `CHANGELOG.md`, `README.md` (upstream).
- Bundled-provider licenses: `dist/src/compiled/*/LICENSE` (kept as extracted;
  see also `NOTICE`).

## Deltas from the upstream tarball

1. Renamed to the private workspace package `@tarima/eve-vendored`.
2. Removed the pinned `nitro: 3.0.261103-rc` dependency. eve's internal nitro
   host (`eve build` / `eve dev`) is NOT used by tarima: we run the eve
   runtime inside our own process (nitro `^3.0.260311-beta`, already a
   dependency of `apps/web`). The compiled runtime code that tarima imports
   (`defineAgent`, `defineTool`, `defineChannel`, `eveChannel`, route/auth
   helpers, the compiled openai provider) does not import `nitro` at runtime —
   the only `nitro` imports in `dist/` are in the `setup/` scaffolding, the
   `eve build` host, and the `eveTanStack()` vite plugin, none of which
   tarima loads. `rolldown` and `undici` are kept as real deps.
3. `exports` trimmed to the subpaths tarima actually imports (`.`,
   `/client`, `/channels`, `/channels/auth`, `/context`, `/models/openai`,
   `/tools`, `/tools/approval`).

## How to re-extract

```bash
mkdir -p /tmp/eve-pk && cd /tmp/eve-pk
npm pack eve@1.0.0-rc.5
tar xzf eve-1.0.0-rc.5.tgz
# copy dist/ bin/ docs/ LICENSE NOTICE README.md CHANGELOG.md into
# packages/eve/, then reapply the deltas above (this file's "Deltas").
```

Sessions/world state: eve stores its local workflow world under
`.eve/.workflow-data` in the app directory (gitignored).
