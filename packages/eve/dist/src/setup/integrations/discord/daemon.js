import{readFile}from"node:fs/promises";import{isErrnoCode,isObject}from"#shared/guards.js";import{formatEveDependencySpecifier,resolveEvePackageContract}from"#setup/scaffold/create/project.js";import{DEFAULT_CONNECT_PACKAGE_VERSION}from"#setup/scaffold/version-tokens.js";const DISCORD_DAEMON_NAME=`discord-gateway`,DISCORD_DAEMON_ROOT=`daemon`;function discordDaemon(e){return{root:DISCORD_DAEMON_ROOT,entrypoint:`Dockerfile`,instances:{[e]:1}}}const DEFAULT_REGION=`iad1`;function discordDaemonFiles(e,t={messageContent:!1}){let n={private:!0,type:`module`,dependencies:{"@vercel/connect":DEFAULT_CONNECT_PACKAGE_VERSION,eve:formatEveDependencySpecifier(resolveEvePackageContract().version)}};return{".dockerignore":`node_modules
`,Dockerfile:`FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY main.ts ./
USER node
CMD ["node", "main.ts"]
`,"main.ts":`import { connectDiscordCredentials } from "@vercel/connect/eve";
import { runDiscordGatewayRelay } from "eve/experimental/channels/discord/gateway";

await runDiscordGatewayRelay({
  credentials: connectDiscordCredentials(${JSON.stringify(e)}),
  // Lets thread follow-ups that don't mention the bot arrive with their text. Needs
  // Message Content Intent under Bot in the Discord Developer Portal, or Discord refuses the relay.
  messageContent: ${String(t.messageContent)},
  // Defaults to the project's production URL; set EVE_URL to relay to \`eve dev\`.
  url: process.env.EVE_URL,
});
`,"package.json":`${JSON.stringify(n,null,2)}\n`}}function discordDaemonEntry(){return`daemons: ${JSON.stringify({[DISCORD_DAEMON_NAME]:discordDaemon(DEFAULT_REGION)})}`}function withDiscordDaemon(e){let t={$schema:`https://openapi.vercel.sh/vercel.json`};if(e!==void 0){let n;try{n=JSON.parse(e)}catch{throw Error(`vercel.json contains invalid JSON; fix it, then run the setup again.`)}if(!isObject(n))throw Error(`vercel.json must contain a JSON object.`);t=n}if(t.daemons!==void 0&&!isObject(t.daemons))throw Error("vercel.json has a `daemons` value that isn't an object; fix it, then run the setup again.");let n=isObject(t.daemons)?t.daemons:{};if(n[`discord-gateway`]!==void 0)return;let r=discordDaemon(Array.isArray(t.regions)&&typeof t.regions[0]==`string`?t.regions[0]:DEFAULT_REGION);return`${JSON.stringify({...t,daemons:{...n,[DISCORD_DAEMON_NAME]:r}},null,2)}\n`}async function readTextFile(e){try{return await readFile(e,`utf8`)}catch(e){if(isErrnoCode(e,`ENOENT`))return;throw e}}export{DISCORD_DAEMON_NAME,DISCORD_DAEMON_ROOT,discordDaemonEntry,discordDaemonFiles,readTextFile,withDiscordDaemon};