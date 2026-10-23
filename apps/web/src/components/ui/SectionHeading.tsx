/**
 * Section heading: eyebrow caps, display title, optional lede.
 * All copy comes from props (i18n lives in packages/copy).
 */
export function SectionHeading({
  eyebrow,
  title,
  lede,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  align?: "left" | "center";
}) {
  const centered = align === "center";
  return (
    <div className={`flex flex-col gap-5 ${centered ? "items-center text-center" : "items-start"}`}>
      <p className="font-body text-xs font-semibold uppercase tracking-[0.1em] text-muted">
        {eyebrow}
      </p>
      <h2 className="font-display text-[clamp(2.5rem,5vw,4.5rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-ink">
        {title}
      </h2>
      {lede ? <p className="max-w-prose font-body text-lg text-muted">{lede}</p> : null}
    </div>
  );
}
