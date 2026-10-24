import { motion, useReducedMotion } from "motion/react";
import * as m from "../../paraglide/messages.js";
import { HeroButton } from "../ui";
import { AnnotatedHeadline } from "./AnnotatedHeadline";
import { ChatBriefPreview, PhoneFrame } from "../preview";

/** Calendar link: public env var, mailto fallback (kept for the app routes). */
export function calendarHref(): string {
  return import.meta.env.VITE_CALENDAR_URL || "mailto:hello@tarima.app?subject=Book%20a%20call";
}

/** Spring entrance (emilkowalski-style physics, no linear easing). */
const springIn = (delay: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, stiffness: 180, damping: 22, delay },
});

/**
 * Single-section landing hero, modelled on the Aceternity playful hero:
 * annotated headline + short lede + two CTAs on the left, the product
 * itself on the right inside a phone mockup.
 *
 * The phone shows what Tarima does (a morning brief with the live board),
 * not decoration. Motion is transform/opacity only.
 */
export function Hero() {
  const reduced = useReducedMotion();
  const item = (delay: number) => (reduced ? {} : springIn(delay));

  return (
    <section className="relative overflow-x-clip">
      {/* soft tonal wash behind the phone (fixed, no blur) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-48 top-0 hidden size-[620px] rounded-full bg-[radial-gradient(circle,#e7e0f6_0%,transparent_68%)] opacity-90 lg:block"
      />

      <div className="mx-auto grid min-w-0 items-center gap-16 px-5 pt-32 pb-20 md:pt-40 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:px-8 lg:pb-32">
        <motion.div className="min-w-0" {...item(0)}>
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">
            <span className="size-1.5 rounded-full bg-mint" />
            {m["hero.eyebrow"]()}
          </p>

          <div className="mt-7">
            <AnnotatedHeadline
              pre={m["hero.titlePre"]()}
              accent={m["hero.titleAccent"]()}
              accent2={m["hero.titleAccent2"]()}
              post={m["hero.titlePost"]()}
            />
          </div>

          <p className="mt-6 max-w-md font-body text-lg leading-relaxed text-muted">
            {m["hero.sub"]()}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <HeroButton variant="primary" href="/login" size="lg" icon>
              {m["hero.cta"]()}
            </HeroButton>
            <HeroButton variant="ghost" href="/demo" size="lg">
              {m["hero.ctaGhost"]()}
            </HeroButton>
          </div>

          <p className="mt-5 text-[13px] text-content-faint">{m["hero.note"]()}</p>
        </motion.div>

        {/* Product preview: the phone is the demo, wrapped in a double bezel
            (outer tray + inner core) so it reads as hardware, not a div. */}
        <motion.div
          className="relative mx-auto w-fit"
          initial={reduced ? undefined : { opacity: 0, y: 26, rotate: -2 }}
          animate={reduced ? undefined : { opacity: 1, y: 0, rotate: 0 }}
          transition={{ type: "spring", stiffness: 140, damping: 20, delay: 0.12 }}
        >
          <div className="rounded-[56px] bg-[linear-gradient(180deg,#e7e0f6_0%,#e6ddf6_100%)] p-8 md:p-10">
            <div className="rounded-[48px] border border-white/60 bg-white/40 p-2">
              <PhoneFrame>
                <ChatBriefPreview />
              </PhoneFrame>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
