import type { SandboxSession } from "eve/sandbox";
/** The person a commit or pull request is created for. */
export interface GitHubCoAuthor {
    readonly email: string;
    readonly name: string;
}
/** Format a validated `Co-authored-by` trailer. */
export declare function coAuthorTrailer(coAuthor: GitHubCoAuthor): string;
/**
 * Append a trailer unless the body already carries it. Git and GitHub read
 * only the last paragraph as trailers, so an existing trailer block is
 * extended rather than followed by a new paragraph.
 */
export declare function withTrailer(body: string, trailer: string): string;
/** True for the commands whose bodies carry attribution. */
export declare function isAttributable(argv: readonly string[]): boolean;
/**
 * Add the trailer to the bodies eve publishes: `gh-signed-commit` commit
 * messages and `gh pr create` descriptions. Other commands are unchanged.
 * A `--body-file` is copied to `bodyFile`, so the model's file stays intact.
 */
export declare function attributeCommand(argv: readonly string[], trailer: string, sandbox: Pick<SandboxSession, "readTextFile" | "writeTextFile">, workingDirectory: string, bodyFile: string): Promise<string[]>;
