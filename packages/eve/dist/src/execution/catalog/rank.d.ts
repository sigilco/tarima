/**
 * Ranking for `eve__search` and for `eve__tool`'s and `eve__skill`'s suggestions when a
 * name is unknown.
 * Query and text split into lowercase words (camelCase, acronyms, and
 * punctuation are boundaries), so `create issue`, `createIssue`, and
 * `create_issue` are the same words. Matches rank in tiers:
 *
 * 1. Exact: the query's words are the full name's words.
 * 2. Exact without namespace: they are the name after its last `__`, so
 *    `create_issue` finds `linear__create_issue` and `sre__create_issue`.
 * 3. Connection: they are the connection's name, or its first whole words,
 *    so `linear` lists the `linear` connection's tools, while `git` leaves
 *    `github`'s tools to the name prefix tier.
 * 4. Name prefix: the full name's words, or those after its last `__`, start
 *    with the query's words, the last of which may be partial, so
 *    `create_iss` finds `create_issue` and `status page incidents` finds
 *    `sre__status_page_incidents_list`.
 * 5. Keyword: any other match. A query word matches a word when either is a
 *    prefix of the other, so `repo` finds `repositories` and `issues` finds
 *    `issue`, and each query word adds the weight of every field it matches.
 *    One-letter and filler words such as `a` and `the` don't score when the
 *    query has other words, so `a` doesn't find `assign`.
 *
 * Within a tier, the keyword score orders matches, then connection, then name.
 */
/** What the ranker reads from one catalog entry. */
export interface RankCandidate {
    /** The entry's own name; a connection tool's name without its connection prefix. */
    readonly name: string;
    readonly description: string;
    readonly inputSchema?: Readonly<Record<string, unknown>>;
    readonly connection?: {
        readonly description: string;
        readonly name: string;
    };
}
/** Candidates matching `query`, best first. */
export declare function rankCandidates<T extends RankCandidate>(query: string, candidates: readonly T[]): T[];
/** Whether `query` has no searchable words, such as `"^"` or `"  "`. */
export declare function isEmptyQuery(query: string): boolean;
/** Names of the candidates closest to an unknown `name`, best first. */
export declare function closestNames(name: string, candidates: readonly RankCandidate[]): string[];
/** Orders by UTF-16 code unit, the same in every locale. */
export declare function compareCodeUnits(a: string, b: string): number;
