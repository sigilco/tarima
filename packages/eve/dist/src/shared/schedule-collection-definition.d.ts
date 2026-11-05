export declare const SCHEDULE_COLLECTION_DEFINITION_BRAND: unique symbol;
export declare const SCHEDULE_COLLECTION_SOURCE: unique symbol;
export interface ScheduleCollectionSourceIdentity {
    readonly application: string;
    readonly collection: string;
    readonly logicalPath: string;
    readonly sourceId: string;
}
export declare function stampScheduleCollectionSource(value: object, identity: ScheduleCollectionSourceIdentity): void;
export declare function readScheduleCollectionSource(value: object): ScheduleCollectionSourceIdentity | undefined;
export declare function isScheduleCollectionDefinition(value: unknown): boolean;
