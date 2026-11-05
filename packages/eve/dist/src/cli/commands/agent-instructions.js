import{readFileSync}from"node:fs";import{join}from"node:path";import pc from"#compiled/picocolors/index.js";import{DEFAULT_AGENT_MODEL_ID}from"#shared/default-agent-model.js";const SETUP_SECTIONS=[`intro-setup.md`,`collect-intent.md`,`vercel-connect.md`,`scaffold.md`,`build-and-verify.md`],HANDOFF_SECTIONS=[`intro-handoff.md`,`collect-intent.md`,`vercel-connect.md`,`build-and-verify.md`];function compose(e,t){let n=e.map(e=>readFileSync(new URL(`./agent-prompt/${e}`,import.meta.url),`utf8`).trim()).join(`

`).replaceAll(`{{devCommand}}`,()=>t.devCommand),{workingDirectory:r}=t;return r===void 0?n:n.replaceAll(`{{workingDirectory}}`,()=>r)}function initAgentInstructions(){return compose(SETUP_SECTIONS,{devCommand:`npx eve dev`})}function initAgentReadySummary(e,t,n={}){let r=e??DEFAULT_AGENT_MODEL_ID,i=e===void 0?pc.dim(` (eve default)`):``,a=n.workspace?`${pc.green(`✓`)} Agents ${pc.bold(join(t,`agents`))}`:`${pc.green(`✓`)} Instructions ${pc.bold(join(t,`agent/instructions.md`))}`;return[`${pc.green(`✓`)} Model ${pc.bold(r)}${i}`,a].join(`
`)}function initAgentDevHandoff(e){return compose(HANDOFF_SECTIONS,{devCommand:e.devCommand,workingDirectory:e.projectPath})}function initExtensionInstructions(){return`You are scaffolding an eve extension package (a reusable package of tools,
connections, skills, and hooks that a consuming agent mounts under
agent/extensions/).

Ask the user for a package directory name, then run:

    npx eve@latest extension init <name>

That creates the package, installs dependencies, and initializes Git. It
prints what was set up and how to author, build, and mount the extension —
it does not start eve dev (extensions are not standalone agents).

Build with \`eve extension build\` (or the package \`build\` script).`}function initExtensionHandoff(e){return[``,`What we set up:`,`  - package.json with eve.extension source/dist roots, peer+dev eve, and zod`,`  - extension/extension.ts (config schema via defineExtension)`,`  - build/prepare scripts → eve extension build`,``,`Next:`,`  - Add tools, skills, hooks, or connections under extension/`,`    (see AGENTS.md and node_modules/eve/docs/extensions/index.md)`,`  - ${`${e.packageManager} run build`}   # builds dist/extension and package exports`,`  - Mount from a consumer agent:`,`      // agent/extensions/${e.packageName}.ts`,`      import ext from "${e.packageName}";`,`      export default ext({ apiKey: process.env.API_KEY });`,``,`Working directory: ${e.projectPath}`].join(`
`)}export{HANDOFF_SECTIONS,SETUP_SECTIONS,initAgentDevHandoff,initAgentInstructions,initAgentReadySummary,initExtensionHandoff,initExtensionInstructions};