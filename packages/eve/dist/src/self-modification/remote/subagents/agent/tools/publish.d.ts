import { type ToolContext } from "eve/tools";
/** Derives replay identity only from eve's verified delegation lineage. */
export declare function publicationOperationId(ctx: Pick<ToolContext, "session">): string;
declare const _default: import("eve/tools").DynamicSentinel<import("eve/tools").DynamicToolResult, import("eve/tools").DynamicContext>;
export default _default;
