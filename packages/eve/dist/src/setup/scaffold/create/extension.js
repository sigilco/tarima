import{pinnedNodeEngineMajor}from"../../node-engine.js";import{pathExists,writeTextFile}from"../files.js";import{blockingCreateInPlaceEntries}from"../create-in-place.js";import{resolveVersionToken}from"../version-tokens.js";import{applyPackageManagerWorkspaceConfiguration,isPackageManagerWorkspaceMember,patchWorkspaceRootPackageJson}from"../workspace-root.js";import{DEFAULT_EVE_PACKAGE_CONTRACT,ROOT_ONLY_PACKAGE_JSON_TEMPLATE_SUFFIX,resolveEvePackageContract}from"./project.js";import{mkdir,readdir}from"node:fs/promises";import{basename,resolve}from"node:path";function renderTemplate(e,t){return e.replaceAll(`__EVE_INIT_APP_NAME__`,t.appName).replaceAll(`__EVE_INIT_PACKAGE_VERSION__`,t.eveVersion).replaceAll(`__EVE_INIT_ZOD_VERSION__`,t.zodPackageVersion).replaceAll(`__EVE_INIT_TYPESCRIPT_VERSION__`,t.typescriptPackageVersion).replaceAll(`__EVE_INIT_TYPES_NODE_VERSION__`,t.nodeTypesVersion).replaceAll(`__EVE_INIT_NODE_ENGINE__`,t.nodeEngine)}function packageJsonTemplate(e){return`${JSON.stringify({name:`__EVE_INIT_APP_NAME__`,version:`0.0.0`,type:`module`,eve:{extension:{source:`./extension`,dist:`./dist/extension`}},files:[`dist`],exports:{".":{types:`./dist/index.d.ts`,default:`./dist/index.mjs`},"./tools":{types:`./dist/tools/index.d.ts`,default:`./dist/tools/index.mjs`}},scripts:{build:`eve extension build`,prepare:`eve extension build`,typecheck:`tsc`},dependencies:{zod:`__EVE_INIT_ZOD_VERSION__`},devDependencies:{"@types/node":`__EVE_INIT_TYPES_NODE_VERSION__`,eve:`__EVE_INIT_PACKAGE_VERSION__`,typescript:`__EVE_INIT_TYPESCRIPT_VERSION__`},peerDependencies:{eve:`*`}},null,2).slice(0,-1)}${e?ROOT_ONLY_PACKAGE_JSON_TEMPLATE_SUFFIX:``}}\n`}function templateFiles(e){return{"extension/extension.ts":`import { defineExtension } from "eve/extension";
import { z } from "zod";

export default defineExtension({
  config: z.object({
    // Replace with the settings consumers pass at the mount site.
    apiKey: z.string(),
  }),
});
`,"tsconfig.json":`{
  "compilerOptions": {
    "target": "ES2022",
    "module": "esnext",
    "moduleResolution": "bundler",
    "types": ["node"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["extension/**/*.ts"]
}
`,".gitignore":`node_modules
.env*
.eve
.vercel
.output
.nitro
dist
.DS_Store
*.tsbuildinfo
`,"AGENTS.md":"# eve Extension Package\n\nThis package is an eve extension — a reusable package of tools, channels,\nconnections, skills, schedules, subagents, hooks, and instruction fragments that a consuming agent\nmounts under `agent/extensions/`.\n\nBefore writing code, read the Extensions guide from the installed eve package\ndocs. In most installs, those docs are at `node_modules/eve/docs/extensions/index.md`.\nIn workspaces or local package installs, resolve the installed `eve` package\nlocation first and read its `docs/extensions/index.md`. If package docs are\nunavailable, use https://eve.dev/docs/extensions as a fallback.\n\n## Authoring\n\n- Declare the extension in `extension/extension.ts` with `defineExtension` from\n  `eve/extension`. Config is optional; read bound values via the handle's\n  `.config` in tools, channels, schedules, hooks, and tools inside contributed subagents.\n- Add contributions under `extension/` the same way as in an agent:\n  `tools/`, `channels/`, `connections/`, `skills/`, `schedules/`, `subagents/`, `hooks/`, and\n  optional instruction fragments. Names come from file paths; the mount supplies the namespace, so\n  name tools for what they do (`search`, not `crm_search`).\n- The extension root cannot declare `agent.ts`, `sandbox`, or nested\n  `extensions/`. A subagent under `extension/subagents/` owns its own agent\n  configuration and sandbox.\n\n## Build and publish\n\n`eve extension build` (wired to `build`/`prepare`) transforms the complete\nagent-shaped source tree into `dist/extension/`, emits type declarations and a\ncompatibility manifest, and fills the package `exports` map. Ship `dist/` only.\nKeep `eve` as a required wildcard peer so the consumer's eve is the one that runs;\neve validates extension compatibility from the generated manifest. Keep the eve\ndevelopment dependency pinned exactly so builds remain reproducible. Upgrade it\nwhen the extension intentionally adopts a newer eve authoring API.\n","CLAUDE.md":`@AGENTS.md
`,"package.json":packageJsonTemplate(e)}}async function assertCanCreateInPlace(e,t){if(!await pathExists(e))return;let n=await readdir(e),r=blockingCreateInPlaceEntries(n);if(r.length>0&&!t){let e=r.slice(0,5).join(`, `),t=r.length>5?`, and ${r.length-5} more`:``;throw Error(`Cannot create project in current directory because it is not empty. Found: ${e}${t}. Use an empty directory.`)}}async function scaffoldExtensionProject(e){let t=resolve(e.targetDirectory??process.cwd(),e.projectName),n=e.projectName===`.`,r=e.overwriteExisting??!1,i=e.packageManager??`pnpm`,a=resolveEvePackageContract(e.evePackage??DEFAULT_EVE_PACKAGE_CONTRACT),o=pinnedNodeEngineMajor(a.nodeEngine),s=resolve(e.workspaceProbeDirectory??t),c=isPackageManagerWorkspaceMember(i,s);if(n)await assertCanCreateInPlace(t,r);else if(await pathExists(t))throw Error(`Cannot create project because "${t}" already exists.`);let l={appName:basename(t),eveVersion:a.version,zodPackageVersion:resolveVersionToken(`zodPackageVersion`,e.zodPackageVersion??`4.5.4`),typescriptPackageVersion:resolveVersionToken(`typescriptPackageVersion`,e.typescriptPackageVersion??`7.0.2`),nodeTypesVersion:o,nodeEngine:o};await mkdir(t,{recursive:!0});for(let[i,a]of Object.entries(templateFiles(!c))){let o=`${t}/${i}`,s=await pathExists(o);await writeTextFile(o,renderTemplate(a,l),{force:n&&r}),s&&await e.onOverwriteFile?.(o)}return await applyPackageManagerWorkspaceConfiguration({packageManager:i,projectRoot:t,workspaceProbeRoot:s,onWorkspaceRootMutation:e.onWorkspaceRootMutation}),await patchWorkspaceRootPackageJson(i,s,{nodeEngineRequirement:a.nodeEngine,onWorkspaceRootMutation:e.onWorkspaceRootMutation}),t}export{scaffoldExtensionProject};