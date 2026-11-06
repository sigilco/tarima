import type { ContactSource } from "@tarima/contract";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GUESSED_INFO = /^info@/i;

function asUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== "http:" && u.protocol !== "https:") return undefined;
    return u.toString();
  } catch {
    return undefined;
  }
}

/**
 * Honest-contact rule: only persist a contact that the provider actually
 * returned. Never invent info@name.com, never take LLM free text.
 */
export function honestContact(input: {
  email?: string;
  phone?: string;
  website?: string;
  source: ContactSource;
}): {
  email?: string;
  phone?: string;
  website?: string;
  source?: ContactSource;
} {
  const emailRaw = input.email?.trim();
  const email =
    emailRaw && EMAIL_RE.test(emailRaw) && !GUESSED_INFO.test(emailRaw) ? emailRaw : undefined;
  const phone = input.phone?.trim() || undefined;
  const website = asUrl(input.website);
  const has = Boolean(email || phone || website);
  return {
    email,
    phone,
    website,
    source: has ? input.source : undefined,
  };
}
