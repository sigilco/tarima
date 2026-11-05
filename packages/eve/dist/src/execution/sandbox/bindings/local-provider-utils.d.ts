export declare function pathExists(path: string): Promise<boolean>;
export declare function copyDirectoryAtomically(sourcePath: string, targetPath: string): Promise<void>;
export declare function touchDirectory(path: string): Promise<void>;
export declare function resolveLocalProviderTemplateRootPath(cacheDirectory: string, providerCacheName: string, templateKey: string): string;
export declare function resolveLocalProviderTemplatesDirectory(cacheDirectory: string, providerCacheName: string): string;
export declare function resolveLocalProviderSessionRootPath(cacheDirectory: string, providerCacheName: string, sessionKey: string): string;
