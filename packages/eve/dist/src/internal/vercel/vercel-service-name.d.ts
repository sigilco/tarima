/** Maximum service-name length accepted by Vercel Services. */
export declare const MAX_VERCEL_SERVICE_NAME_LENGTH = 64;
/** Whether a name satisfies the Vercel Services naming contract. */
export declare function isValidVercelServiceName(name: string): boolean;
/** Assert that a generated or authored service name can be deployed to Vercel. */
export declare function assertValidVercelServiceName(name: string, subject: string): void;
