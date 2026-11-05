import type { ScheduleProvider } from "#public/schedules/subscription.js";
/** Client options of a Vercel provider, so delivery verification talks to the same endpoint. */
export declare function readVercelScheduleClientOptions(provider: ScheduleProvider): VercelScheduleProviderOptions | undefined;
/** Sent with every Schedules API request so Vercel Schedules can attribute eve's traffic. */
export declare const VERCEL_SCHEDULES_CLIENT_HEADERS: Readonly<Record<string, string>>;
export interface VercelScheduleProviderOptions {
    /** Overrides the public Vercel Schedules endpoint. */
    readonly baseUrl?: string;
    readonly fetch?: typeof fetch;
}
/** Uses ambient OIDC on Vercel and process-local storage under `eve dev`. */
export declare function vercelScheduleProvider(options?: VercelScheduleProviderOptions): ScheduleProvider;
