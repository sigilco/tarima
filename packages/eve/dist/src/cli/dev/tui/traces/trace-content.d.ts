/**
 * Formats span attribute values for the `/traces` detail panel. Payload
 * attributes render as readable structure — prompt messages as a chat-like
 * transcript with role-prefixed blocks and hanging indents, JSON as
 * pretty-printed blocks — instead of one wrapped blob.
 *
 * Every returned line fits the given width; wrapped continuations keep a
 * two-space hanging indent so they read as part of their block.
 */
/**
 * Formats one attribute's value into display lines, each at most `width`
 * columns. A single scalar stays on one line so the panel can keep it beside
 * its key; multi-line content comes back unindented for the caller to nest
 * under the key. `dim` styles de-emphasized parts (role prefixes, the
 * truncation notice), so callers pass their surface's dim style.
 */
export declare function formatAttributeContent(key: string, value: unknown, dim: (text: string) => string, width: number): string[];
/**
 * Wraps text to `width`, splitting on embedded newlines so a multi-line payload
 * keeps its shape, and stripping control bytes the frame must not carry.
 */
export declare function wrapPlainText(text: string, width: number): string[];
/** Formats a payload: JSON structure pretty-prints, anything else stays text. */
export declare function formatPayloadContent(text: string, width: number): string[];
