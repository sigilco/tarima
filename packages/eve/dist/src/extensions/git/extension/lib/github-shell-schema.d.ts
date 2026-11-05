import { z } from "zod";
/** An `owner` or `owner/name` GitHub target. */
export declare const GITHUB_TARGET: RegExp;
export declare const githubShellInputSchema: z.ZodObject<{
    command: z.ZodString;
    repository: z.ZodOptional<z.ZodString>;
    description: z.ZodString;
    workingDirectory: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
