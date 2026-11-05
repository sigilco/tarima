import type { Nitro } from "nitro/types";
import type { HostSpec } from "#internal/nitro/host/host-spec.js";
/**
 * Creates eve's Nitro host: one isolated candidate for `eve dev`, or one
 * production build. The returned Nitro is configured entirely by its config.
 */
export declare function createHostNitro(spec: HostSpec): Promise<Nitro>;
