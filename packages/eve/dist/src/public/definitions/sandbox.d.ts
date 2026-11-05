import type { SandboxSelector } from "#shared/sandbox-environment.js";
export type { SandboxCommandResult, SandboxProcess, SandboxReadBinaryFileOptions, SandboxReadFileOptions, SandboxRemovePathOptions, SandboxReadTextFileOptions, SandboxRunOptions, SandboxSession, RuntimeSandboxSession, SandboxSpawnOptions, SandboxWriteBinaryFileOptions, SandboxWriteFileOptions, SandboxWriteFilesOptions, SandboxWriteTextFileOptions, } from "#shared/sandbox-session.js";
export type { SandboxOpenArguments, SandboxEnvironment, SandboxSelector, SandboxSelectorContext, } from "#shared/sandbox-environment.js";
export declare function defineSandbox(definition: SandboxSelector): SandboxSelector;
export declare function defineParentSandbox(): SandboxSelector;
