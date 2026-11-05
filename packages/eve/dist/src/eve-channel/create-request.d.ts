import type { MessageContent } from "#shared/message-content.js";
import type { SessionCallback, SessionCapabilities } from "#channel/types.js";
import type { ClientContextValue } from "#eve-channel/types.js";
import type { JsonObject } from "#shared/json.js";
import type { ToolStub } from "#tool-stubs/types.js";
export interface ParsedCreateBody {
    stubs?: readonly ToolStub[];
    callback?: SessionCallback;
    capabilities?: SessionCapabilities;
    message?: MessageContent;
    context?: ClientContextValue;
    operationId?: string;
    outputSchema?: JsonObject;
    /** Remote agent protocol of a delegating caller; set only with {@link callback}. */
    protocolVersion?: number;
}
/** Enforces the fields that only make sense when creation also starts a turn. */
export declare function validateMessageFreeCreate(input: {
    readonly callback: SessionCallback | undefined;
    readonly hasClientContext: boolean;
    readonly hasMessageField: boolean;
    readonly message: MessageContent | undefined;
    readonly outputSchema: JsonObject | undefined;
}): Response | undefined;
