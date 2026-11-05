import { shellQuote } from "#shared/shell-quote.js";
/** Quote one argument for Vercel's POSIX build-command shell. */
export declare const quoteVercelShellArgument: typeof shellQuote;
/** Return a portable relative path for a generated Vercel configuration. */
export declare function toVercelRelativePath(from: string, to: string): string;
