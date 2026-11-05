import type { SessionEvent } from "#protocol/session-event.js";
import type { ContextContainer } from "#context/container.js";
/** A remote session sends input to its caller instead of presenting it on its own channel. */
export declare function forwardSessionInput(ctx: ContextContainer, event: SessionEvent, inputSource?: string): Promise<boolean>;
