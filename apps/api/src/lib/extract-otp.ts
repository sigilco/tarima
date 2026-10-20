/**
 * Pull a one-time code out of a rendered email body.
 *
 * Ordered strategies, most explicit first, so a message that contains
 * both a label and a bare number resolves to the labelled one. Each
 * strategy is anchored so ordinary prose numbers (prices, dates, phone
 * numbers, years) do not false-positive: a bare six digit run must be a
 * standalone token, not a digit substring of something longer.
 */

const SIX_DIGITS = String.raw`\d{6}`;

const STRATEGIES: RegExp[] = [
  // <strong>123456</strong> or any other emphasized single run of digits.
  new RegExp(String.raw`<(?:strong|b|em|span)[^>]*>\s*(${SIX_DIGITS})\s*</`, "i"),
  // "OTP: 123456", "Your code is 123456", "Codigo: 123456"
  new RegExp(
    String.raw`(?:otp|code|c[oó]digo|verification|security)\s*(?:is|:|：|-)?\s*(${SIX_DIGITS})`,
    "i",
  ),
  // Standalone run: not glued to another digit and not part of a longer
  // alphanumeric token (avoids matching inside ids, phone numbers, or
  // ISO timestamps).
  new RegExp(String.raw`(?:^|[^\w])(${SIX_DIGITS})(?:[^\w]|$)`, "m"),
];

/**
 * Extract the first six digit code found in `html`, or null when there is
 * none. Safe on plain text input as well: the strategies simply fail to
 * match and we fall through to null.
 */
export function extractOtp(html: string): string | null {
  if (!html) return null;
  for (const strategy of STRATEGIES) {
    const match = strategy.exec(html);
    if (match?.[1]) return match[1];
  }
  return null;
}
