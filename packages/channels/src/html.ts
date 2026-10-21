import { parse } from "node-html-parser";

/**
 * HTML to plain text. Used for the text part of an outbound email and for
 * the body of an inbound message that only carries HTML. Script and style
 * elements are dropped before extraction so their contents never leak into
 * a message body.
 */
export function htmlToText(html: string): string {
  if (!html) return "";
  const root = parse(html);
  for (const el of root.querySelectorAll("script, style, noscript, template")) el.remove();
  return root.structuredText
    .replace(/[ \t]+\n/g, "\n") // trailing spaces before a break
    .replace(/\n[ \t]+/g, "\n") // leading spaces after a break
    .replace(/\n{3,}/g, "\n\n") // collapse blank runs
    .trim();
}
