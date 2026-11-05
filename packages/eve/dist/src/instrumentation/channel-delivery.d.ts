import type { AlsContext } from "#context/container.js";
import type { CreateInstrumentationHandleEventInput } from "#instrumentation/native-events.js";
import type { InstrumentationEvent } from "#instrumentation/lifecycle.js";
import type { SessionEvent } from "#protocol/session-event.js";
export declare function deliveryEvent(event: SessionEvent, ctx: AlsContext | undefined, session: CreateInstrumentationHandleEventInput): InstrumentationEvent | undefined;
