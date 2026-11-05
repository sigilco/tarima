export declare const invocationName: (name?: string) => string;
export declare function applyAttributes(span: {
    setAttribute(key: string, value: Exclude<Attributes[string], undefined>): unknown;
}, attributes: Attributes): void;
import type { ContentSerializer } from "./types.js";
import type { ScopeData, ScopeRecord, ScopeTerminal } from "./types.js";
import type { Attributes, CaptureDecision, PreparedSpan } from "./types.js";
import type { TraceOperation } from "./writer.js";
export declare function parentKinds(data: ScopeData): readonly ScopeData["type"][];
export declare function prepareScope(record: Omit<ScopeRecord, "reference">, serializer: ContentSerializer): PreparedSpan;
export declare function completeScope(span: TraceOperation, data: ScopeData, result: ScopeTerminal, capture: CaptureDecision, startTimeMs: number, serializer: ContentSerializer): void;
export declare function capturedScopeData(data: ScopeData, capture: CaptureDecision): ScopeData;
