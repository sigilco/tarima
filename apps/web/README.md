# web

TanStack Start app (React 19, Tailwind v4, Vite). Stage 0 additions:

## Semantic tokens

Use only the `@theme` semantic names in components: `bg-surface`,
`bg-surface-raised`, `text-content`, `text-content-muted`,
`border-border-subtle`, `text-accent`, `bg-accent-soft`,
`text-success`, `text-warning`, `text-danger` (plus `-soft` variants).
Raw palette variables stay for landing-page art direction only.

## Icons

Per-icon imports via unplugin-icons virtual modules:
`import IconSettings from "~icons/lucide/settings"`. No runtime icon library.

## React Compiler (T0.4 verdict: WORKS, enabled)

`@vitejs/plugin-react@6` supports `react({ compiler: {} })` natively (oxc
path, no Babel needed). It requires the optional peer `oxc-transform-react`,
which is installed as a devDependency. Build verified on React 19.2:
compiled output contains `useMemoCache` calls (React Compiler cache hooks),
typecheck green. The separate `@rolldown/plugin-babel` +
`babel-plugin-react-compiler` route is unnecessary here and is not used.

## Nanostores

Pattern in `src/lib/stores.ts`: atoms for server state written by route
loaders (hono RPC), computed selectors for views, never fetch-in-useEffect.
URL state (modals, filters) stays in TanStack Router `validateSearch`.
