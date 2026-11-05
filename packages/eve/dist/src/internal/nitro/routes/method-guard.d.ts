import { type H3Event } from "nitro";
/**
 * Rejects HEAD on a path that declares GET but no HEAD route, before the route
 * does any work, with the same 405 Nitro sends for an undeclared method.
 */
export declare function rejectHeadRequest(event: H3Event, allow: string): void;
