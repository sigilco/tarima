import { type Attributes } from "#compiled/@opentelemetry/api/index.js";
/** Called only from existing host steps; workflow bodies cannot export host spans. */
export declare function traceSessionHandover(phase: "forwarding_started" | "part_submitted" | "final_submitted" | "inbox_unblocked", sessionId: string, attemptKey: string, attributes: Attributes): void;
