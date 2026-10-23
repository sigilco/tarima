/**
 * Card with a soft vertical gradient wash (Auralis tonal layering).
 * Hairline border, rounded-card (24px), no drop shadows.
 */
const TONES = {
  lavender: "bg-[linear-gradient(180deg,#e7e0f6_0%,#e6ddf6_100%)]",
  mint: "bg-[linear-gradient(180deg,#dcebe8_0%,#dbebe8_100%)]",
  paper: "bg-[linear-gradient(180deg,var(--color-surface-dim)_0%,transparent_100%)]",
} as const;

export function WashCard({
  tone,
  children,
  className = "",
}: {
  tone: keyof typeof TONES;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`card rounded-card border border-line ${TONES[tone]} ${className}`}>
      {children}
    </div>
  );
}
