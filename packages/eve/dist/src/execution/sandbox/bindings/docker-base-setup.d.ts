/**
 * Base setup applied to containers created from the raw base image and to
 * Vercel sessions when they are attached. Keeps the framework-owned
 * base layer deliberately tiny: create `/workspace`, verify Bash, and provide
 * the standard file-descriptor path that Bash process substitution requires.
 */
export declare function buildDockerBaseSetupScript(): string;
