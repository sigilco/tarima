/**
 * Rough token estimate: serialized JSON UTF-8 bytes / 4, with file parts
 * counted at what providers bill for media instead of their base64 length.
 * Bytes, not string length: a CJK character is one UTF-16 unit but about one
 * token, and its three UTF-8 bytes track that cost far better. Good enough
 * for deciding whether compaction is needed; the real token count comes back
 * from the model each step via
 * `CompactionConfig.lastKnownInputTokens`.
 *
 * Accepts any JSON-serializable value so callers can apply the same heuristic
 * to whole message arrays or individual content parts on one consistent ruler.
 */
export declare function estimateTokens(value: unknown): number;
