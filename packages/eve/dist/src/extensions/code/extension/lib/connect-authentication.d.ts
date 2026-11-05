import { getToken } from "@vercel/connect";
import type { SandboxSession } from "eve/sandbox";
import extension from "../extension.ts";
type ExtensionConfig = typeof extension.config;
type GetToken = typeof getToken;
export declare function authenticateTurn(config: ExtensionConfig, getSandbox: () => Promise<SandboxSession>, getConnectToken?: GetToken): Promise<void>;
export {};
