import type { ScopeRecord } from "./types.js";
import type { ContentSerializer } from "./types.js";
import type { TraceSnapshot } from "./types.js";
export declare function boundedSerializer(serializer: ContentSerializer, onError?: import("./types.js").TraceErrorHandler): ContentSerializer;
export declare function traceSnapshot(value: unknown): TraceSnapshot;
export declare function validSnapshot(value: unknown, maxBytes?: number, depth?: number): value is ScopeRecord;
export declare function snapshotRecord(record: ScopeRecord, serializer: ContentSerializer): ScopeRecord;
