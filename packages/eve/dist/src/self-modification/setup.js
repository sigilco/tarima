import{renderLocalSelfModificationExtension}from"./scaffold.js";import{createHash}from"node:crypto";import{mkdir,readFile,writeFile}from"node:fs/promises";import{join,relative}from"node:path";import{execFile}from"node:child_process";import{promisify}from"node:util";import{stripLogicalPathExtension}from"#discover/filesystem.js";import{captureVercel,runVercelCaptureStdout}from"#setup/primitives/run-vercel.js";import{discoverAgent}from"#discover/discover-agent.js";import{sourcesOf}from"#discover/manifest.js";const SELF_MODIFICATION_CONFIG_PATH=`agent/extensions/self-modification/extension.ts`,DEPLOYED_SELF_MODIFICATION_CONFIG_PATH=`agent/extensions/self-modification-remote/extension.ts`,runFile=promisify(execFile),DEFAULT_EXTENSION=renderLocalSelfModificationExtension(),defaultDependencies={captureVercel,runVercelCaptureStdout};function connectorName(e,t){return`selfmod-${e}-${t}`.toLowerCase().replaceAll(/[^a-z0-9-]/gu,`-`)}function renderSelfModificationConfig(e){if(e===void 0)return DEFAULT_EXTENSION;let t=`      case "channel:eve": {
        const projectId = process.env.VERCEL_PROJECT_ID;
        return (
          projectId !== undefined &&
          projectId.length > 0 &&
          principal?.authenticator === "oidc" &&
          (principal.issuer === "https://oidc.vercel.com" ||
            principal.issuer?.startsWith("https://oidc.vercel.com/") === true) &&
          principal.attributes.project_id === projectId
        );
      }
${[...new Set(e.channelNames)].filter(e=>e!==`eve`).sort().map(e=>`      case ${JSON.stringify(`channel:${e}`)}:
        // Authorize trusted principals for this channel before returning true.
        return false;`).join(`
`)}`,n=`Self-modification could not obtain a GitHub credential from Vercel Connect for ${e.connector}. Install and attach the configured GitHub connector to this Vercel project, install the managed GitHub App for the configured repository, then retry.`,r=`import { getToken } from "@vercel/connect";
import selfModification from "eve/extensions/self-modification/remote";

export default selfModification({
  source: {
    git: {
      repository: ${JSON.stringify(e.repository)},
      directory: ${JSON.stringify(e.directory)},
    },
  },
  target: { branch: ${JSON.stringify(e.branch)} },
  credentials: {
    async resolve({ capability, repository }) {
      try {
        return await getToken(${JSON.stringify(e.connector)}, {
          authorizationDetails: [
            {
              type: "github_app_installation",
              repositories: [repository.owner + "/" + repository.repo],
            },
          ],
          scopes:
            capability === "checkout"
              ? ["contents:read", "metadata:read"]
              : ["contents:write", "pull_requests:write", "metadata:read"],
          subject: { type: "app" },
        });
      } catch (error) {
        throw new Error(${JSON.stringify(n)}, { cause: error });
      }
    },
  },
  authorize: ({ channel, principal }) => {
    switch (channel.kind) {
${t}      default:
        // Add another branch when you add a trusted channel.
        return false;
    }
  },
});
`;return`// eve-self-modification: generated-v1 digest:${createHash(`sha256`).update(r).digest(`hex`)}\n${r}`}function classifySelfModificationConfig(e){if(e===void 0)return`missing`;if(e===DEFAULT_EXTENSION)return`local`;let[t,...n]=e.split(`
`);return/^\/\/ eve-self-modification: generated-v1 digest:([a-f0-9]{64})$/u.exec(t??``)?.[1]===createHash(`sha256`).update(n.join(`
`)).digest(`hex`)?`generated`:`authored`}function parseGitHubRemote(e){let t=e.trim().match(/^(?:https?:\/\/github\.com\/|git@github\.com:|ssh:\/\/git@github\.com\/)([^/]+)\/([^/]+?)(?:\.git)?$/u);return t?.[1]===void 0||t[2]===void 0?void 0:{owner:t[1],repo:t[2]}}function defaultSelfModificationSetupOperations(e,t=defaultDependencies,n=e){let r=join(e,DEPLOYED_SELF_MODIFICATION_CONFIG_PATH);return{async detectChannelNames(){let t=await discoverAgent({appRoot:e,agentRoot:join(e,`agent`)});return sourcesOf(t.manifest,`channel`).map(e=>stripLogicalPathExtension(e.logicalPath).replace(/^channels\//,``))},async detectGitRepository(){let t=await gitOutput(e,[`config`,`--get`,`remote.origin.url`]),n=t===void 0?void 0:parseGitHubRemote(t),r=await gitOutput(e,[`symbolic-ref`,`--quiet`,`--short`,`refs/remotes/origin/HEAD`]),i=await gitOutput(e,[`rev-parse`,`--show-toplevel`]);return{...n,branch:r?.replace(/^origin\//u,``),directory:i===void 0?void 0:repositoryRelativeDirectory(i,e),remoteKind:t===void 0?`missing`:n===void 0?`other`:`github`}},readConfig:()=>readOptionalFile(r),readLocalConfig:()=>readOptionalFile(join(e,SELF_MODIFICATION_CONFIG_PATH)),async writeConfig(e){await mkdir(join(r,`..`),{recursive:!0}),await writeFile(r,e,`utf8`)},async findOrCreateConnector(e,r){let i=await listGitHubConnectors(n,r,t.captureVercel),a=`github/${e}`,o=i.find(e=>e.uid===a);if(o!==void 0){if(o.type!==`github`)throw Error(`The existing connector ${a} is not a GitHub connector.`);return o.uid}let s=await t.runVercelCaptureStdout([`connect`,`create`,`github`,`--name`,e,`-F`,`json`,`--scope`,r.orgId],{cwd:n}),c=s.ok?parseCreatedConnector(s.stdout):void 0;if(c===void 0||!c.startsWith(`github/`))throw Error(`Could not create a GitHub Vercel Connect connector.`);return c},async attachConnector(e,r){if(!(await t.runVercelCaptureStdout([`connect`,`attach`,e,`--project`,r.projectId,`--environment`,`production`,`--yes`,`--scope`,r.orgId],{cwd:n})).ok)throw Error(`Could not attach ${e} to the selected Vercel project for Production.`)}}}async function readOptionalFile(e){try{return await readFile(e,`utf8`)}catch(e){if(e.code===`ENOENT`)return;throw e}}function parseCreatedConnector(e){try{let t=JSON.parse(e);return typeof t.uid==`string`?t.uid:void 0}catch{return}}function parseConnectorListPage(e){try{let t=JSON.parse(e);if(!Array.isArray(t.connectors))return;let n=t.connectors.flatMap(e=>typeof e==`object`&&e&&typeof e.uid==`string`&&typeof e.type==`string`?[{uid:e.uid,type:e.type}]:[]);return typeof t.cursor==`string`?{connectors:n,cursor:t.cursor}:{connectors:n}}catch{return}}async function listGitHubConnectors(e,t,n){let r=[],i=new Set,a;do{let o=[`connect`,`list`,`--all-projects`,`--service`,`github`,`-F`,`json`,`--scope`,t.orgId];a!==void 0&&o.push(`--next`,a);let s=await n(o,{cwd:e});if(!s.ok)throw Error(`Could not list GitHub connectors for the selected Vercel project. ${s.failure.message}`);let c=parseConnectorListPage(s.stdout);if(c===void 0)throw Error(`Vercel returned an invalid GitHub connector list for the selected project.`);if(r.push(...c.connectors),c.cursor!==void 0&&i.has(c.cursor))throw Error(`The GitHub connector list repeated cursor ${c.cursor}.`);c.cursor!==void 0&&i.add(c.cursor),a=c.cursor}while(a!==void 0);return r}function repositoryRelativeDirectory(e,t,n=relative){return n(e,t).replaceAll(`\\`,`/`)||`.`}function repositoryPartError(e){return/^[A-Za-z0-9_.-]+$/u.test(e)?void 0:`Enter a valid GitHub owner or repository name.`}function directoryError(e){return e===`.`||e.length>0&&!e.startsWith(`/`)&&!e.includes(`\\`)&&e.split(`/`).every(e=>e!==``&&e!==`.`&&e!==`..`)?void 0:`Enter a safe repository-relative directory or ".".`}function gitRefError(e){return/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u.test(e)&&!e.endsWith(`.`)&&!e.endsWith(`/`)&&!e.includes(`..`)&&!e.includes(`//`)&&!e.includes(`@{`)?void 0:`Enter a valid branch name.`}async function gitOutput(e,t){try{return(await runFile(`git`,t,{cwd:e})).stdout.trim()||void 0}catch{return}}export{DEPLOYED_SELF_MODIFICATION_CONFIG_PATH,SELF_MODIFICATION_CONFIG_PATH,classifySelfModificationConfig,connectorName,defaultSelfModificationSetupOperations,directoryError,gitRefError,parseGitHubRemote,renderSelfModificationConfig,repositoryPartError,repositoryRelativeDirectory};