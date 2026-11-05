export declare function availableDirectModels(provider: "openai" | "anthropic", key: string, signal?: AbortSignal): Promise<string[]>;
export declare function availableHelperModels(provider: "openai" | "anthropic" | "chatgpt", signal?: AbortSignal): Promise<string[]>;
