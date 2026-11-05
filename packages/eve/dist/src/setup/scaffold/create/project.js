import{pinnedNodeEngineMajor}from"../../node-engine.js";import{parseChatGptModelSelection}from"../../../shared/chatgpt-model.js";import{SUPPORTED_AUTHORED_MODULE_FILE_EXTENSIONS}from"../update/module-files.js";import{pathExists,writeTextFile}from"../files.js";import{blockingCreateInPlaceEntries}from"../create-in-place.js";import{DEFAULT_CONNECT_PACKAGE_VERSION,resolveVersionToken}from"../version-tokens.js";import{applyPackageManagerWorkspaceConfiguration,isPackageManagerWorkspaceMember,patchWorkspaceRootPackageJson}from"../workspace-root.js";import{WEB_CHANNEL_TEMPLATES}from"./web-template.js";import{AGENT_INSTRUCTIONS_TEMPLATE}from"./instructions-template.js";import{SCAFFOLDED_AGENT_PATHS}from"./agent-paths.js";import{mkdir,readdir,stat}from"node:fs/promises";import{basename,join,resolve}from"node:path";const CURRENT_DIRECTORY_PROJECT_NAME=`.`,DEFAULT_AI_PACKAGE_VERSION=`^7.0.137`,DEFAULT_ZOD_PACKAGE_VERSION=`4.5.4`,DEFAULT_EVE_PACKAGE_CONTRACT={version:`1.0.0-rc.5`,nodeEngine:`>=24`};function resolveEvePackageContract(e=DEFAULT_EVE_PACKAGE_CONTRACT){return{version:resolveVersionToken(`evePackage.version`,e.version),nodeEngine:resolveVersionToken(`evePackage.nodeEngine`,e.nodeEngine)}}function modelProviderSlug(e){let t=(e.split(`/`)[0]??``).replaceAll(/[^A-Za-z0-9._-]/gu,``);return t.length>0?t:`anthropic`}function byokProviderEnvVar(e){let t=modelProviderSlug(e).toUpperCase().replaceAll(/[^A-Z0-9]/gu,`_`);return`${/^[0-9]/.test(t)?`_`:``}${t}_API_KEY`}function agentTemplateFiles(e,t){return{[SCAFFOLDED_AGENT_PATHS.config]:renderAgentTemplate(e,t),[SCAFFOLDED_AGENT_PATHS.channel]:WEB_CHANNEL_TEMPLATES.default,[SCAFFOLDED_AGENT_PATHS.instructions]:AGENT_INSTRUCTIONS_TEMPLATE}}function renderAgentTemplate(e,t){let n=parseChatGptModelSelection(e);return n===void 0?BASE_AGENT_TEMPLATE.replaceAll(`__EVE_INIT_MODEL__`,e).replaceAll(`__EVE_INIT_REASONING__`,reasoningTemplateLine(t)):`import { defineAgent } from "eve";\nimport { chatgpt } from "eve/models/openai";\n\nexport default defineAgent({\n  model: chatgpt(${JSON.stringify(n)}),\n${reasoningTemplateLine(t)}});\n`}function reasoningTemplateLine(e){return e===void 0||e===`provider-default`?``:`  reasoning: "${e}",\n`}function renderTemplate(e,t){return e===BASE_AGENT_TEMPLATE&&parseChatGptModelSelection(t.model)!==void 0?renderAgentTemplate(t.model,t.reasoning):e.replaceAll(`__EVE_INIT_APP_NAME__`,t.appName).replaceAll(`__EVE_INIT_MODEL__`,t.model).replaceAll(`__EVE_INIT_REASONING__`,reasoningTemplateLine(t.reasoning)).replaceAll(`__EVE_INIT_BYOK_PROVIDER__`,modelProviderSlug(t.model)).replaceAll(`__EVE_INIT_BYOK_ENV_VAR__`,byokProviderEnvVar(t.model)).replaceAll(`__EVE_INIT_PACKAGE_VERSION__`,formatEveDependencySpecifier(t.eveVersion)).replaceAll(`__EVE_INIT_AI_SDK_VERSION__`,t.aiPackageVersion).replaceAll(`__EVE_INIT_CONNECT_VERSION__`,t.connectPackageVersion).replaceAll(`__EVE_INIT_ZOD_VERSION__`,t.zodPackageVersion).replaceAll(`__EVE_INIT_TYPESCRIPT_VERSION__`,t.typescriptPackageVersion).replaceAll(`__EVE_INIT_TYPES_NODE_VERSION__`,t.nodeTypesVersion).replaceAll(`__EVE_INIT_NODE_ENGINE__`,t.nodeEngine)}function formatEveDependencySpecifier(e){return/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z-.]+)?$/.test(e)?`^${e}`:e}const BASE_AGENT_TEMPLATE=`import { defineAgent } from "eve";

export default defineAgent({
  model: "__EVE_INIT_MODEL__",
__EVE_INIT_REASONING__});
`;function packageJsonTemplate(e){return`{
  "name": "__EVE_INIT_APP_NAME__",
  "version": "0.0.0",
  "type": "module",
  "imports": {
    "#*": "./agent/*",
    "#evals/*": "./evals/*"
  },
  "scripts": {
    "build": "eve build",
    "deploy": "eve deploy",
    "dev": "eve dev",
    "eval": "eve eval",
    "start": "eve start",
    "typecheck": "tsc"
  },
  "dependencies": {
    "@vercel/connect": "__EVE_INIT_CONNECT_VERSION__",
    "ai": "__EVE_INIT_AI_SDK_VERSION__",
    "eve": "__EVE_INIT_PACKAGE_VERSION__",
    "zod": "__EVE_INIT_ZOD_VERSION__"
  },
  "devDependencies": {
    "@types/node": "__EVE_INIT_TYPES_NODE_VERSION__",
    "typescript": "__EVE_INIT_TYPESCRIPT_VERSION__"
  }${e?ROOT_ONLY_PACKAGE_JSON_TEMPLATE_SUFFIX:``}
}
`}const ROOT_ONLY_PACKAGE_JSON_TEMPLATE_SUFFIX=`,
  "engines": {
    "node": "__EVE_INIT_NODE_ENGINE__"
  }
`,SHARED_TEMPLATE_FILES={"README.md":`# __EVE_INIT_APP_NAME__

This is an [eve](https://eve.dev) agent bootstrapped with [\`eve init\`](https://eve.dev/docs/reference/cli#eve-init).

## Getting started

First, run the development server:

\`\`\`bash
eve dev
\`\`\`

The development TUI opens an interactive session where you can send messages to your agent.

Start by editing \`agent/instructions.md\` to define the agent's identity, purpose, tone, and response guidelines. Configure its model and runtime behavior in \`agent/agent.ts\`.

Add capabilities under \`agent/\`, including tools, connections, channels, skills, subagents, and schedules. eve reloads your changes as you work.

## Learn more

To learn more about eve, explore these resources:

- [eve documentation](https://eve.dev/docs) — learn about eve's features and authoring APIs.
- [eve on GitHub](https://github.com/vercel/eve) — view the source and contribute.

## Deploy on Vercel

Deploy your agent to [Vercel](https://vercel.com) from the project root:

\`\`\`bash
eve deploy
\`\`\`

\`eve deploy\` links a Vercel project if needed and deploys the agent to production. See the [eve deployment documentation](https://eve.dev/docs/guides/deployment/vercel) for authentication, environment variables, and deployment options.
`,[SCAFFOLDED_AGENT_PATHS.channel]:WEB_CHANNEL_TEMPLATES.default,[SCAFFOLDED_AGENT_PATHS.instructions]:AGENT_INSTRUCTIONS_TEMPLATE,"tsconfig.json":`{
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
  "include": ["agent/**/*.ts", "evals/**/*.ts"]
}
`,".gitignore":`node_modules
.env*
.eve
.vercel
.next
.output
.nitro
dist
.DS_Store
*.tsbuildinfo
`,".vercelignore":`node_modules
.env*
.eve
.next
.output
.nitro
dist
`,"AGENTS.md":"# eve Agent App\n\nThis project uses the eve framework: an agent is a directory of files under `agent/`, and eve compiles and runs it.\n\nFor a content-only change to the root agent's identity, purpose, tone, or response guidelines, edit its existing authored instructions. Fresh projects use `agent/instructions.md`; a project may instead use `agent/instructions.ts` or files under `agent/instructions/`. You do not need to read the framework docs for a content-only instructions change. A fresh project already has its selected model in `agent/agent.ts`; preserve that file unless the user asks to change the model.\n\n## Read the docs before writing code\n\n```sh\nls node_modules/eve/docs\n```\n\nStart with `docs/README.md`: it maps each task to the page that covers it. Read that page before authoring tools, connections, channels, skills, subagents, schedules, or deployment. In a workspace or local package install, resolve the installed `eve` package location first. If the package docs are missing, use https://eve.dev/docs.\n\nUse a bounded authoring loop:\n\n1. Read the relevant page and inspect only files you will modify or need to imitate.\n2. Stop discovery once the file location, imports, and definition shape are clear. Implement the smallest complete behavior the user requested.\n3. Run one narrow verification. Expand investigation only when it fails or the request needs project-specific details.\n\nFollow links or inspect public types only when the routed page leaves the task unanswered. Do not recursively glob `node_modules`, enumerate the entire docs tree, or read unrelated scaffold files when the direct path is known. Package-manager links can hide files from recursive glob tools even though direct reads work.\n\n## Prefer an existing integration\n\nWhen a task names an external product or service, search the registry before implementing its integration. For a generic capability, author a tool instead.\n\n```sh\neve registry search <query> --json\neve registry view <item>\n```\n\nPrefer items whose `implementation` is `native`; use Chat SDK adapters when no native channel fits. `registry view` links the item's documentation.\n\nInstall without driving interactive prompts:\n\n```sh\neve add <item> --non-interactive\n```\n\nExit code 0 means setup completed, 1 failed, and 2 needs an answer or a prerequisite. On exit 2, run the `next.command` from the final NDJSON event. For a non-secret question, replace its `<JSON value>` answer placeholder with the answer you collected; string values need JSON quotes. Never pass a secret in `--answer`. See `docs/install-integrations.mdx` for setup prerequisites.\n\n## Use eve for Vercel operations\n\nUse eve to link and deploy Vercel projects:\n\n```sh\neve link --non-interactive --project <name-or-id> [--team <team-id-or-slug>]\neve deploy --non-interactive --yes [--project <name-or-id>]\n```\n\nA setup may report `eve link` as a prerequisite; run it, then retry the continuation. When a completed setup event has `deploymentRequired: true`, run the `next` command it reports.\n\n## Validate the change\n\nRun the validation the task requests. When it does not establish the behavior you changed, run the narrowest relevant check.\n","CLAUDE.md":`@AGENTS.md
`};function templateFiles(e){return{[SCAFFOLDED_AGENT_PATHS.config]:e.byokProvider?`import { defineAgent } from "eve";

export default defineAgent({
  model: "__EVE_INIT_MODEL__",
__EVE_INIT_REASONING__  modelOptions: {
    providerOptions: {
      gateway: {
        byok: {
          "__EVE_INIT_BYOK_PROVIDER__": [{ apiKey: process.env.__EVE_INIT_BYOK_ENV_VAR__! }],
        },
      },
    },
  },
});
`:BASE_AGENT_TEMPLATE,...SHARED_TEMPLATE_FILES,"package.json":packageJsonTemplate(e.includeRootOnlyPackageJsonFields)}}async function assertCanCreateInPlace(e,t){if(!await pathExists(e))return;let n=await readdir(e),r=blockingCreateInPlaceEntries(n);if(r.length>0&&!t){let e=r.slice(0,5).join(`, `),t=r.length>5?`, and ${r.length-5} more`:``;throw Error(`Cannot create project in current directory because it is not empty. Found: ${e}${t}. Use an empty directory.`)}}async function scaffoldBaseProject(e){let t=resolve(e.targetDirectory??process.cwd(),e.projectName),n=e.projectName===`.`,r=e.overwriteExisting??!1,i=e.byokProvider??!1,a=e.packageManager??`pnpm`,o=resolveEvePackageContract(e.evePackage),s=pinnedNodeEngineMajor(o.nodeEngine),c=resolve(e.workspaceProbeDirectory??t),l=isPackageManagerWorkspaceMember(a,c);if(n)await assertCanCreateInPlace(t,r);else if(await pathExists(t))throw Error(`Cannot create project because "${t}" already exists.`);let u={appName:basename(t),model:e.model,reasoning:e.reasoning,eveVersion:o.version,aiPackageVersion:resolveVersionToken(`aiPackageVersion`,e.aiPackageVersion??`^7.0.137`),connectPackageVersion:resolveVersionToken(`connectPackageVersion`,e.connectPackageVersion??`2.7.0`),zodPackageVersion:resolveVersionToken(`zodPackageVersion`,e.zodPackageVersion??`4.5.4`),typescriptPackageVersion:resolveVersionToken(`typescriptPackageVersion`,e.typescriptPackageVersion??`7.0.2`),nodeTypesVersion:s,nodeEngine:s};await mkdir(t,{recursive:!0});for(let[a,o]of Object.entries(templateFiles({byokProvider:i,includeRootOnlyPackageJsonFields:!l}))){let i=`${t}/${a}`,s=await pathExists(i);await writeTextFile(i,renderTemplate(o,u),{force:n&&r}),s&&await e.onOverwriteFile?.(i)}return await applyPackageManagerWorkspaceConfiguration({packageManager:a,projectRoot:t,workspaceProbeRoot:c,onWorkspaceRootMutation:e.onWorkspaceRootMutation}),await patchWorkspaceRootPackageJson(a,c,{nodeEngineRequirement:o.nodeEngine,onWorkspaceRootMutation:e.onWorkspaceRootMutation}),t}async function isEveProject(e){for(let t of SUPPORTED_AUTHORED_MODULE_FILE_EXTENSIONS)try{return await stat(join(e,`agent`,`agent${t}`)),!0}catch{}return!1}export{CURRENT_DIRECTORY_PROJECT_NAME,DEFAULT_AI_PACKAGE_VERSION,DEFAULT_CONNECT_PACKAGE_VERSION,DEFAULT_EVE_PACKAGE_CONTRACT,DEFAULT_ZOD_PACKAGE_VERSION,ROOT_ONLY_PACKAGE_JSON_TEMPLATE_SUFFIX,agentTemplateFiles,byokProviderEnvVar,formatEveDependencySpecifier,isEveProject,modelProviderSlug,resolveEvePackageContract,scaffoldBaseProject};