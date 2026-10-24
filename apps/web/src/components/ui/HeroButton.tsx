/**
 * Landing CTA button — a daisyUI `btn` styled to the Auralis system:
 * solid ink primary / hairline ghost, radius-btn, no shadows.
 * Rendered as an <a> (hrefs are internal routes or mailto).
 *
 * `icon` renders a trailing arrow nested in its own circular wrapper
 * (button-in-button) so the glyph never floats naked next to the label.
 */
const VARIANTS = {
  primary:
    "btn-neutral bg-ink text-white border-ink hover:opacity-90 hover:scale-[-1%] active:scale-[1%]",
  ghost:
    "btn-ghost border border-line bg-transparent hover:bg-surface-dim hover:scale-[-1%] active:scale-[1%]",
} as const;

const SIZES = {
  md: "",
  lg: "btn-lg",
} as const;

export function HeroButton({
  variant,
  href,
  size = "md",
  icon = false,
  children,
}: {
  variant: keyof typeof VARIANTS;
  href: string;
  size?: keyof typeof SIZES;
  icon?: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className={`btn group rounded-btn font-body no-underline ${VARIANTS[variant]} ${SIZES[size]}`}
    >
      <span>{children}</span>
      {icon ? (
        <span
          aria-hidden
          className="flex size-6 items-center justify-center rounded-full bg-white/15 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5"
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
      ) : null}
    </a>
  );
}
