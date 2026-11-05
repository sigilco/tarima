import{realpathSync}from"node:fs";import{resolvePackageRoot}from"#internal/application/package.js";import{isPathInsideOrEqual}from"#shared/path-inside.js";import{exactRegex}from"#internal/bundler/filters.js";import{checkExternalDependencyOutput}from"#internal/nitro/host/external-dependency-output-check.js";const QUERY_SUFFIX=String.raw`(?:[?#].*)?$`,NITRO_DATA_RUNTIME_RE=/^nitro\/(?:database|kv|storage)$/,PRUNED_ROLLDOWN_ID=`\0eve-pruned-rolldown`,ROLLDOWN_RE=/^rolldown(?:\/.*)?$/,PRUNED_DEVELOPMENT_LAZY_PREWARM_ID=`\0eve-pruned-development-lazy-prewarm`,DEVELOPMENT_LAZY_PREWARM_SOURCE_RE=new RegExp(String.raw`(?:^|[/\\#])execution[/\\]sandbox[/\\]development-lazy-prewarm\.(?:js|ts)`+QUERY_SUFFIX),PRUNED_OPTIONAL_ENGINE_INSTALL_ID=`\0eve-pruned-optional-engine-install`,OPTIONAL_ENGINE_INSTALL_SOURCE_RE=new RegExp(String.raw`(?:^|[/\\#])internal[/\\]application[/\\]optional-package-install\.(?:js|ts)`+QUERY_SUFFIX),PRUNED_LOCAL_SANDBOX_ID=`\0eve-pruned-local-sandbox-providers`,PRUNED_LOCAL_SANDBOX_PROVIDER_ID=`\0eve-pruned-local-sandbox-provider-constructors`,LOCAL_BINDING_SOURCE_RE=/[/\\]bindings[/\\](?:docker|just-bash|local)\.(?:js|ts)$/,LOCAL_PROVIDER_SOURCE_RE=/(?:^|[/\\#])sandbox[/\\]providers[/\\](?:docker|just-bash)\.(?:js|ts)$/,LOCAL_SANDBOX_SOURCE_FILTER=new RegExp(String.raw`(?:[/\\]bindings[/\\](?:docker|just-bash|local)|(?:^|[/\\#])sandbox[/\\]providers[/\\](?:docker|just-bash))\.(?:js|ts)`+QUERY_SUFFIX);function stripQuery(e){return e.split(/[?#]/u,1)[0]??e}function createHostedGraphPlugin(e){let{externals:t}=e,n=t.pruneDevelopmentRuntime,r=t.pruneSandboxProviders,i=new Set(t.untracedExternals),a=n?realpathSync(resolvePackageRoot()):void 0,o=[NITRO_DATA_RUNTIME_RE,...n?[DEVELOPMENT_LAZY_PREWARM_SOURCE_RE,OPTIONAL_ENGINE_INSTALL_SOURCE_RE,ROLLDOWN_RE]:[],...r?[LOCAL_SANDBOX_SOURCE_FILTER]:[],...[...i].map(e=>exactRegex(e))],s=[...n?[exactRegex(PRUNED_DEVELOPMENT_LAZY_PREWARM_ID),exactRegex(PRUNED_OPTIONAL_ENGINE_INSTALL_ID),OPTIONAL_ENGINE_INSTALL_SOURCE_RE,exactRegex(PRUNED_ROLLDOWN_ID)]:[],...r?[exactRegex(PRUNED_LOCAL_SANDBOX_ID),exactRegex(PRUNED_LOCAL_SANDBOX_PROVIDER_ID),LOCAL_SANDBOX_SOURCE_FILTER]:[]],c={name:`eve:hosted-graph`,resolveId:{order:`pre`,filter:{id:o},handler(e,t){if(NITRO_DATA_RUNTIME_RE.test(e))throw Error(`"${e}" is not available in eve agents: eve's server does not configure Nitro storage or databases. Keep data in agent state or memory (https://eve.dev/docs/concepts/state), or use your database's own client.`);return i.has(e)?{external:!0,id:e}:n&&DEVELOPMENT_LAZY_PREWARM_SOURCE_RE.test(e)?PRUNED_DEVELOPMENT_LAZY_PREWARM_ID:n&&OPTIONAL_ENGINE_INSTALL_SOURCE_RE.test(e)?PRUNED_OPTIONAL_ENGINE_INSTALL_ID:a!==void 0&&ROLLDOWN_RE.test(e)&&t!==void 0&&isPathInsideOrEqual(stripQuery(t),a)?PRUNED_ROLLDOWN_ID:r&&LOCAL_PROVIDER_SOURCE_RE.test(stripQuery(e))?PRUNED_LOCAL_SANDBOX_PROVIDER_ID:r&&LOCAL_BINDING_SOURCE_RE.test(stripQuery(e))?PRUNED_LOCAL_SANDBOX_ID:null}}};return s.length>0&&(c.load={filter:{id:s},handler(e){return n&&e===PRUNED_DEVELOPMENT_LAZY_PREWARM_ID?`export async function ensureDevelopmentSandboxesPrepared() {}
`:n&&e===PRUNED_ROLLDOWN_ID?`throw new Error("Rolldown is not part of hosted eve servers: it bundles only during eve build and eve dev.");
`:n&&(e===PRUNED_OPTIONAL_ENGINE_INSTALL_ID||OPTIONAL_ENGINE_INSTALL_SOURCE_RE.test(e))?`function pruned() {
  throw new Error("Optional local sandbox engines cannot be installed in production server runtimes.");
}
export const detectProjectPackageManager = pruned;
export const importInstalledEnginePackage = pruned;
export const installPackageIntoProject = pruned;
export const loadOptionalEnginePackage = pruned;
`:r&&(e===PRUNED_LOCAL_SANDBOX_PROVIDER_ID||LOCAL_PROVIDER_SOURCE_RE.test(stripQuery(e)))?`function pruned() {
  throw new Error("Local sandbox providers are pruned from hosted server bundles.");
}
export const DockerSandbox = { name: "docker", environment: pruned, dockerfile: pruned, image: pruned };
export const JustBashSandbox = { name: "just-bash", environment: pruned };
`:r&&(e===PRUNED_LOCAL_SANDBOX_ID||LOCAL_BINDING_SOURCE_RE.test(stripQuery(e)))?`function pruned() {
  throw new Error("Local sandbox providers are pruned from hosted server bundles.");
}
export const createDockerSandboxProvider = pruned;
export const createJustBashSandboxProvider = pruned;
export const DOCKER_PROVIDER_NAME = "docker";
export const DOCKER_TEMPLATE_IMAGE_REPOSITORY = "eve-sandbox-template";
export const JUST_BASH_PROVIDER_NAME = "just-bash";
export const isLinuxDockerDaemonAvailableSync = () => false;
export const pruneDockerSandboxTemplates = pruned;
export const pruneJustBashSandboxTemplates = pruned;
export const pruneLocalSandboxTemplates = pruned;
export const pruneLocalSandboxTemplatesInBackground = pruned;
export const stopDevelopmentSandboxResources = pruned;
`:null}}),t.checkedExternals.length>0&&(c.writeBundle=async(n,r)=>{await checkExternalDependencyOutput({appRoot:e.appRoot,bundle:r,externalDependencies:t.checkedExternals,outputDir:n.dir})}),c}export{createHostedGraphPlugin};