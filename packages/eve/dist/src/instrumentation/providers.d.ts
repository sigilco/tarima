import { type InstrumentationProvider } from "#instrumentation/provider.js";
/** One provider and the `instrumentation/<slot>.ts` file it came from. */
export interface RegisteredInstrumentationProvider {
    readonly provider: InstrumentationProvider;
    readonly slot: string;
}
/** Fills reserved slots before authored files may reconfigure or disable them. */
export declare function seedInstrumentationProviders(): void;
/**
 * Releases every registered provider and OTel processor from Nitro's close
 * hook, the last point a buffered exporter can still reach the network.
 */
export declare function shutdownInstrumentationProviders(): Promise<void>;
