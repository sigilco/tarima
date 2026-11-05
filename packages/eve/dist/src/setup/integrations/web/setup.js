import{installScaffoldDependencies}from"../shared/scaffold.js";import{prepareWebAuthScaffold}from"./auth-scaffold.js";import{WEB_AUTHENTICATION_QUESTION}from"./auth-options.js";import{WEB_CHAT_FRAMEWORK_LABELS,detectWebChatFramework}from"./framework.js";import{defaultWebChatHostingDeps,peerServiceVercelConfig,prepareWebChatHosting,resolveWebChatProject,runScriptCommand}from"./hosting.js";import{provisionWebChatAuth}from"./provision-auth.js";import{defineSetupIntegration}from"../types.js";import{join}from"node:path";import{select}from"#setup/ask.js";import{WEB_APP_TANSTACK_TEMPLATE_FILES}from"#setup/scaffold/create/web-template.js";const NEXT_HOSTED_CONFIG=`import type { NextConfig } from "next";
import { withEve } from "eve/next";
import { fileURLToPath } from "node:url";

const nextConfig: NextConfig = {};
const eveRoot = fileURLToPath(new URL("../..", import.meta.url));

export default withEve(nextConfig, { eveRoot });
`,PEER_SERVICE_NEXT_CONFIG=`import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
`,REGISTRY_NEXT_CONFIG=`import type { NextConfig } from "next";
import { withEve } from "eve/next";

const nextConfig: NextConfig = {};

export default withEve(nextConfig);
`,NEXT_PEER_SERVICE_VERCEL_CONFIG=peerServiceVercelConfig(`nextjs`,`node ../../node_modules/next/dist/bin/next build`),LEGACY_NEXT_PEER_SERVICE_VERCEL_CONFIG=NEXT_PEER_SERVICE_VERCEL_CONFIG.replace(/    web: \{[^}]+\},/,`    web: { framework: "nextjs", root: "apps/web" },`),TANSTACK_REGISTRY_VITE_CONFIG=WEB_APP_TANSTACK_TEMPLATE_FILES[`vite.config.ts`],TANSTACK_HOSTED_VITE_CONFIG=`import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { eveTanStack } from "eve/tanstack";
import { nitro } from "nitro/vite";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const eveRoot = fileURLToPath(new URL("../..", import.meta.url));

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    eveTanStack({ eveRoot }),
    tailwindcss(),
    tanstackStart({ srcDirectory: "app" }),
    viteReact(),
    nitro(),
  ],
});
`,TANSTACK_PEER_SERVICE_VERCEL_CONFIG=peerServiceVercelConfig(`tanstack-start`,`node ../../node_modules/vite/bin/vite.js build`),INSTALLER_VERCEL_CONFIGS=[NEXT_PEER_SERVICE_VERCEL_CONFIG,LEGACY_NEXT_PEER_SERVICE_VERCEL_CONFIG,TANSTACK_PEER_SERVICE_VERCEL_CONFIG],defaultWebSetupDeps={...defaultWebChatHostingDeps,prepareWebAuthScaffold,provisionWebChatAuth,installScaffoldDependencies};function hostingQuestion(e){let t=WEB_CHAT_FRAMEWORK_LABELS[e];return select({key:`web-hosting`,message:`How should Web Chat and your agents be deployed?`,options:[{id:`vercel`,label:`Vercel services`,hint:`(Recommended) Web Chat and agents deploy as separate services.`,value:`vercel`},{id:e,label:t,hint:`One ${t} app serves Web Chat and routes agent requests.`,value:e}],recommended:`vercel`,required:!0})}async function prepareWebSetup(e,t=defaultWebSetupDeps){let n=await resolveWebChatProject(e.appRoot,t),r=await detectWebChatFramework(join(n.environmentRoot,`apps`,`web`),t.pathExists)??`next`,i=r===`next`&&await t.pathExists(join(n.environmentRoot,`app`,`eve-agent.ts`))&&!await t.pathExists(join(n.environmentRoot,`apps`,`web`,`app`,`eve-agent.ts`)),a=i?`next`:r===`tanstack`&&n.agentName!==void 0?`vercel`:await e.asker.ask(hostingQuestion(r)),o=(r===`next`?await e.asker.ask(WEB_AUTHENTICATION_QUESTION):`custom`)===`vercel`?await e.resolveVercelProject(`Web Chat sign-in`):void 0,s={framework:r,hosting:a,packageManager:(await t.detectPackageManager(n.environmentRoot)).kind};return o!==void 0&&(s.authProject=o),i&&(s.rootWebChat=!0),s}function hostConfig(e,t){let n=e.hosting===`vercel`;if(e.framework===`tanstack`)return{path:join(t,`vite.config.ts`),source:n?TANSTACK_REGISTRY_VITE_CONFIG:TANSTACK_HOSTED_VITE_CONFIG,owned:[TANSTACK_REGISTRY_VITE_CONFIG,TANSTACK_HOSTED_VITE_CONFIG]};let r=e.rootWebChat?REGISTRY_NEXT_CONFIG:NEXT_HOSTED_CONFIG;return{path:join(t,`next.config.ts`),source:n?PEER_SERVICE_NEXT_CONFIG:r,owned:[REGISTRY_NEXT_CONFIG,NEXT_HOSTED_CONFIG,PEER_SERVICE_NEXT_CONFIG]}}async function applyWebSetup(e,t,n=defaultWebSetupDeps){let r=await resolveWebChatProject(t.appRoot,n),i=e.rootWebChat?r.environmentRoot:join(r.environmentRoot,`apps`,`web`),a=e.authProject===void 0?void 0:await n.prepareWebAuthScaffold({environmentRoot:r.environmentRoot,agentAppRoot:r.agentAppRoot,webRoot:i,force:t.force}),o=e.hosting===`vercel`,s=e.framework===`tanstack`?TANSTACK_PEER_SERVICE_VERCEL_CONFIG:NEXT_PEER_SERVICE_VERCEL_CONFIG;await(await prepareWebChatHosting({project:r,webRoot:i,force:t.force,writeChannel:a===void 0,hostConfig:hostConfig(e,i),vercelServices:o,vercelConfigs:[s,...INSTALLER_VERCEL_CONFIGS.filter(e=>e!==s)]},n))();let c=o?`dev:all`:e.rootWebChat?`dev`:`dev:web`;e.authProject!==void 0&&a!==void 0&&(await n.provisionWebChatAuth(e.authProject,t.signal),t.signal?.throwIfAborted(),await a(),await n.installScaffoldDependencies({changed:!0,log:t.presenter.log,projectPath:r.environmentRoot,signal:t.signal}),t.presenter.log.success(`Configured Sign in with Vercel for this project's team`),t.presenter.nextSteps(["Local setup is complete. Run `eve deploy` to publish these changes. Production and preview credentials are configured.",`Local development continues to use localDev() without signing in.`])),t.presenter.log.success(`Configured channel: web`);let l={facts:[{label:``,value:`Start locally with \`${runScriptCommand(e.packageManager,c)}\`.`}]};return e.authProject!==void 0&&(l.deploymentRequired=!0),l}const WEB_SETUP=defineSetupIntegration({kind:`web`,label:`Web Chat`,hint:`Browser-based chat interface`,prepare:prepareWebSetup,apply:applyWebSetup});export{WEB_SETUP,applyWebSetup,prepareWebSetup};