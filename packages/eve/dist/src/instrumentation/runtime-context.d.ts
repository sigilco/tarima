import type { ModelMessage, SystemModelMessage } from "ai";
import type { ChannelInstrumentationProjection, SessionAuthContext, SessionParent } from "#channel/types.js";
import type { AlsContext } from "#context/container.js";
import type { TurnPosition } from "#harness/session-machine/view.js";
import type { HarnessSession } from "#harness/types.js";
import type { RuntimeContextResolver } from "#tracing/eve/otel-declaration.js";
export interface BuildTelemetryRuntimeContextInput {
    readonly attempt: number;
    readonly capturesContent: boolean;
    readonly context?: InstrumentationRuntimeContextSnapshot;
    readonly emissionState: TurnPosition;
    readonly environment: string;
    readonly modelInput: {
        readonly instructions: string | SystemModelMessage | undefined;
        readonly messages: readonly ModelMessage[];
    };
    readonly providerResolvers?: readonly RuntimeContextResolver[];
    readonly session: HarnessSession;
}
export interface InstrumentationRuntimeContextSnapshot {
    readonly channel?: ChannelInstrumentationProjection;
    readonly currentAuth: SessionAuthContext | null;
    readonly initiatorAuth: SessionAuthContext | null;
    readonly parent?: SessionParent;
}
export declare function snapshotInstrumentationRuntimeContext(context: AlsContext | undefined): InstrumentationRuntimeContextSnapshot;
/**
 * Builds per-model-call runtime context for AI SDK telemetry spans.
 *
 * Runtime context is parsed defensively. Invalid results, reserved `eve.*`
 * keys, and callback failures are warning-only.
 */
export declare function buildTelemetryRuntimeContext(input: BuildTelemetryRuntimeContextInput): Record<string, unknown> | undefined;
