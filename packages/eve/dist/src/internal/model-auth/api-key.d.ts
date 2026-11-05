declare const KEY_ENV: {
    readonly openai: "OPENAI_API_KEY";
    readonly anthropic: "ANTHROPIC_API_KEY";
    readonly "ai-gateway-key": "AI_GATEWAY_API_KEY";
};
export declare function resolveModelApiKey(provider: keyof typeof KEY_ENV): Promise<string>;
export {};
