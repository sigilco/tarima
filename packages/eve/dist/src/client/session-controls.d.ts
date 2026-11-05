import { type PrewarmSessionResult } from "#protocol/prewarm-session.js";
import type { ClientRedirectPolicy } from "#client/types.js";
import { type DeliveryReceipt } from "#protocol/delivery.js";
import { createEveSessionCancelRoutePath, createEveSessionClearRoutePath, createEveSessionCompactRoutePath, createEveSessionEndRoutePath } from "#protocol/routes.js";
declare const paths: {
    cancel: typeof createEveSessionCancelRoutePath;
    clear: typeof createEveSessionClearRoutePath;
    compact: typeof createEveSessionCompactRoutePath;
    end: typeof createEveSessionEndRoutePath;
};
export declare function prewarmClientSession(input: {
    readonly context: {
        readonly baseUrl: string;
        readonly redirect?: ClientRedirectPolicy;
        resolveHeaders(): Promise<Headers>;
    };
    readonly sessionId: string;
    readonly signal?: AbortSignal;
}): Promise<PrewarmSessionResult>;
export declare function sendClientControl(input: {
    readonly context: {
        readonly baseUrl: string;
        readonly redirect?: ClientRedirectPolicy;
        resolveHeaders(): Promise<Headers>;
    };
    readonly kind: keyof typeof paths;
    readonly sessionId: string;
    readonly options?: {
        readonly signal?: AbortSignal;
        readonly turnId?: string | null;
        readonly reason?: string;
    };
}): Promise<DeliveryReceipt>;
export {};
