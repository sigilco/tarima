/**
 * daisyUI badge with token colors — status pills on preview rows.
 */
const TONES = {
  ink: "badge-neutral bg-ink text-white border-ink",
  lavender: "bg-lavender text-ink border-line",
  mint: "bg-mint text-ink border-line",
  muted: "bg-surface-dim text-muted border-line",
} as const;

export function Badge({ tone, children }: { tone: keyof typeof TONES; children: React.ReactNode }) {
  return <span className={`badge ${TONES[tone]}`}>{children}</span>;
}
