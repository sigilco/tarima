import { pathExists } from "#setup/scaffold/files.js";
/** Frontend frameworks the Web Chat installer can generate. */
export type WebChatFramework = "next" | "tanstack";
export declare const WEB_CHAT_FRAMEWORK_LABELS: Readonly<Record<WebChatFramework, string>>;
/** Asked by `eve add channel/web` before it installs the frontend files. */
export declare const WEB_FRAMEWORK_QUESTION: import("#setup/ask.js").Question<WebChatFramework>;
/** The framework of the app already in `webRoot`, or `undefined` when it has none. */
export declare function detectWebChatFramework(webRoot: string, exists?: typeof pathExists): Promise<WebChatFramework | undefined>;
