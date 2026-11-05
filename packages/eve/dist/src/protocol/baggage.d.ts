import type { ForwardedTraceAssertion } from "#shared/forwarded-trace-policy.js";
import type { SessionParent } from "#channel/types.js";
interface BaggageProperty {
    readonly key: string;
    readonly value?: string;
}
interface BaggageMember {
    readonly value: string;
    readonly properties: readonly BaggageProperty[];
}
type ForwardedTraceBaggage = "absent" | "malformed" | ForwardedTraceAssertion;
type ForwardedParentSessionBaggage = "absent" | "malformed" | SessionParent;
/** Reads remote parent lineage without trusting the caller that supplied it. */
export declare function readForwardedParentSessionBaggage(value: string | null): ForwardedParentSessionBaggage;
/** Replaces Eve's remote parent lineage while preserving unrelated baggage. */
export declare function writeForwardedParentSessionBaggage(value: string | undefined, parent: SessionParent | undefined): string | undefined;
/** Reads eve's audience member without interpreting unrelated baggage. */
export declare function readForwardedAudienceBaggage(value: string | null): ForwardedTraceBaggage;
/** Replaces any authored eve audience member while preserving unrelated baggage entries. */
export declare function writeForwardedAudienceBaggage(value: string | undefined, assertion: ForwardedTraceAssertion | undefined): string | undefined;
export declare function stripEveTraceBaggage(carrier: Record<string, string>): void;
/** Recognized members are singular; malformed or oversized input fails closed. */
export declare function readBaggageMember(value: string | null, key: string): BaggageMember | "absent" | "malformed";
/** Replaces a member with an encoded value and optional properties; undefined removes it. */
export declare function replaceBaggageMember(value: string | undefined, key: string, member: string | undefined): string | undefined;
export {};
