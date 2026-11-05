type HostHttpMethod = "ALL" | "GET" | "POST";
interface HostHttpRegistration {
    readonly capability: "workflow" | "development" | "schedule";
    readonly method: HostHttpMethod;
    readonly path: string;
    readonly reservationOnly?: boolean;
}
export declare const HOST_HTTP_INVENTORY: readonly HostHttpRegistration[];
export {};
