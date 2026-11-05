import { type DevelopmentModelCredential, type DevelopmentModelProvider } from "./development-broker-protocol.js";
export declare function developmentModelBrokerAvailable(): boolean;
export declare function readDevelopmentModelCredential(provider: DevelopmentModelProvider, rejectedToken?: string, signal?: AbortSignal | null): Promise<DevelopmentModelCredential | undefined>;
