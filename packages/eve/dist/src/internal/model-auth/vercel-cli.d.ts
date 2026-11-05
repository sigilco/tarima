export declare function readVercelCliTeam(): Promise<string | undefined>;
/** Read-only: Vercel CLI retains ownership of its credentials and token rotation. */
export declare function readVercelCliConnection(): Promise<{
    token: string;
    teamId: string;
} | undefined>;
/** Read a CLI token without requiring a selected team (personal accounts have none). */
export declare function readVercelCliToken(): Promise<string | undefined>;
export declare function refreshVercelCliConnection(): Promise<void>;
