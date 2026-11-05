import type { JustBashFilesystem } from "#public/sandbox/just-bash-sandbox.js";
export declare function createSelfModificationFilesystem(input: {
    readonly appRoot?: string;
    readonly defaultFilesystem: JustBashFilesystem;
    resolveProjectPath?(path: string): string;
    readonly justBash: typeof import("just-bash");
}): Promise<JustBashFilesystem>;
