import { type Span } from "#compiled/@opentelemetry/api/index.js";
/** Call with policy-projected errors; undefined retains failure status without content. */
export declare function recordAgentSpanError(span: Span, error: unknown, errorType?: string): void;
