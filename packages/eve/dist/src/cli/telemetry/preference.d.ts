import { type EveCliTelemetryIdentity } from "#cli/telemetry/identity.js";
type EveTelemetryPreference = {
    readonly enabled: boolean;
    readonly notified: boolean;
};
export declare function readEveTelemetryPreference(): Promise<EveTelemetryPreference>;
export declare function readOrCreateEveTelemetryIdentity(): Promise<EveCliTelemetryIdentity>;
export declare function setEveTelemetryEnabled(enabled: boolean): Promise<void>;
export declare function markEveTelemetryNotified(): Promise<void>;
export {};
