import type { ModelMessage } from "ai";
/** Answer orphaned historical calls without executing them. */
export declare function repairToolHistory(input: {
    readonly messages: readonly ModelMessage[];
    readonly insertionIndex?: number;
    /** Nothing follows `messages` in the request, so a provider result they await can still come. */
    readonly endsRequest?: boolean;
}): {
    messages: ModelMessage[];
    insertionIndex: number | undefined;
};
