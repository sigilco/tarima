import { motion, useReducedMotion } from "motion/react";
import * as m from "../../paraglide/messages.js";
import { HeroButton } from "../ui";
import { AnnotatedHeadline } from "./AnnotatedHeadline";
import { CallTranscriptPreview, PhoneFrame } from "../preview";

/** Calendar link: public env var, mailto fallback (plan §Hero). */
export function calendarHref(): string {
  return import.meta.env.VITE_CALENDAR_URL || "mailto:hello@tarima.app?subject=Book%20a%20call";
}

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.6, ease: [0.32, 0.72, 0, 1] as const },
});

/**
 * Playful hero: headline + CTAs left, phone preview right on a lavender
 * wash. Entrance is a staggered fade-rise (transform/opacity only).
 */
export function Hero() {
  const reduced = useReducedMotion();
  const item = (delay: number) =>
    reduced
      ? {}
      : {
          ...rise(delay),
        };

  return (
    <section className="relative overflow-x-clip">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-24 hidden size-[560px] rounded-full bg-[radial-gradient(circle,#e7e0f6_0%,transparent_65%)] opacity-80 lg:block"
      />
      <div className="mx-auto grid min-w-0 items-center gap-16 px-5 pb-28 pt-36 md:pt-44 lg:grid-cols-2 lg:px-8">
        <motion.div className="min-w-0" {...item(0)}>
          <p className="inline-flex items-center rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold tracking-[0.1em] text-muted uppercase">
            {m["hero.eyebrow"]()}
          </p>
          <div className="mt-7">
            <AnnotatedHeadline
              pre={m["hero.titlePre"]()}
              accent={m["hero.titleAccent"]()}
              post={m["hero.titlePost"]()}
            />
          </div>
          <p className="mt-7 max-w-md font-body text-lg text-muted">{m["hero.sub"]()}</p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <HeroButton variant="primary" href="/login" size="lg">
              {m["hero.cta"]()}
            </HeroButton>
            <HeroButton variant="ghost" href={calendarHref()} size="lg">
              {m["hero.ctaGhost"]()}
            </HeroButton>
          </div>
          <p className="mt-5 text-[13px] text-content-faint">{m["hero.note"]()}</p>
        </motion.div>

        <motion.div
          className="relative mx-auto flex w-fit items-center justify-center rounded-[48px] bg-[linear-gradient(180deg,#e7e0f6_0%,#e6ddf6_100%)] p-8 md:p-12"
          {...item(150)}
        >
          <PhoneFrame>
            <CallTranscriptPreview />
          </PhoneFrame>
        </motion.div>
      </div>
    </section>
  );
}
