/**
 * Landing CTA button — a daisyUI `btn` styled to the Auralis system:
 * solid ink primary / hairline ghost, radius-btn, no shadows.
 * Rendered as an <a> (hrefs are internal routes or mailto).
 */
const VARIANTS = {
  primary:
    "btn-neutral bg-ink text-white border-ink hover:opacity-90 hover:scale-[-1%] active:scale-[-1%]",
  ghost:
    "btn-ghost border border-line bg-transparent hover:bg-surface-dim hover:scale-[-1%] active:scale-[-1%]",
} as const;

const SIZES = {
  md: "",
  lg: "btn-lg",
} as const;

export function HeroButton({
  variant,
  href,
  size = "md",
  children,
}: {
  variant: keyof typeof VARIANTS;
  href: string;
  size?: keyof typeof SIZES;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className={`btn rounded-btn font-body no-underline ${VARIANTS[variant]} ${SIZES[size]}`}
    >
      {children}
    </a>
  );
}
