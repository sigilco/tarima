import { createFileRoute } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import * as m from "../paraglide/messages.js";
import { Nav } from "../components/Nav";
import { HeroButton, SectionHeading, WashCard } from "../components/ui";
import { Hero, calendarHref } from "../components/landing/Hero";

export const Route = createFileRoute("/")({ component: Landing });

const HOW_STEPS = [
  { t: m["how.s1t"], d: m["how.s1d"] },
  { t: m["how.s2t"], d: m["how.s2d"] },
  { t: m["how.s3t"], d: m["how.s3d"] },
  { t: m["how.s4t"], d: m["how.s4d"] },
];

const WHY_CARDS = [
  { t: m["why.c1t"], d: m["why.c1d"] },
  { t: m["why.c2t"], d: m["why.c2d"] },
  { t: m["why.c3t"], d: m["why.c3d"] },
];

const PRICING_CARDS = [
  { p: m["pricing.card1p"], t: m["pricing.card1t"], d: m["pricing.card1d"] },
  { p: m["pricing.card2p"], t: m["pricing.card2t"], d: m["pricing.card2d"] },
  { p: m["pricing.card3p"], t: m["pricing.card3t"], d: m["pricing.card3d"] },
];

const FAQ_ITEMS = [
  { q: m["faq.q1"], a: m["faq.a1"] },
  { q: m["faq.q2"], a: m["faq.a2"] },
  { q: m["faq.q3"], a: m["faq.a3"] },
  { q: m["faq.q4"], a: m["faq.a4"] },
];

function Landing() {
  const reduced = useReducedMotion();

  const rise = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: "0px 0px -10% 0px" },
          transition: { delay, duration: 0.6, ease: [0.32, 0.72, 0, 1] as const },
        };

  return (
    <div className="min-h-[100dvh] overflow-x-clip bg-paper text-ink">
      <Nav />

      <Hero />

      {/* ── Two jobs ─────────────────────────────────────── */}
      <section id="jobs" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-24 md:py-40 lg:px-8">
        <motion.div className="mx-auto max-w-2xl" {...rise(0)}>
          <SectionHeading
            eyebrow={m["jobs.eyebrow"]()}
            title={m["jobs.title"]()}
            lede={m["jobs.sub"]()}
          />
        </motion.div>
        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {(
            [
              ["venues", m["jobs.c1t"](), m["jobs.c1d"](), "lavender"],
              ["sponsors", m["jobs.c2t"](), m["jobs.c2d"](), "mint"],
            ] as const
          ).map(([v, t, d, tone], i) => (
            <motion.div key={v} {...rise(i * 100)}>
              <WashCard tone={tone} className="h-full p-8">
                <h3 className="font-display text-2xl font-semibold text-ink">{t}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{d}</p>
              </WashCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section
        id="how"
        className="scroll-mt-24 border-y border-line bg-surface-dim/50 py-24 md:py-40"
      >
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <motion.div className="max-w-2xl" {...rise(0)}>
            <SectionHeading eyebrow={m["how.eyebrow"]()} title={m["how.title"]()} />
          </motion.div>
          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {HOW_STEPS.map((s, i) => (
              <motion.div key={i} {...rise(i * 90)}>
                <div className="h-full rounded-card border border-line bg-surface p-7">
                  <span className="font-display text-3xl font-semibold text-ink/20">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-5 text-[15px] font-semibold text-ink">{s.t()}</h3>
                  <p className="mt-2.5 text-[13.5px] leading-relaxed text-ink-2">{s.d()}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why / differentiation ────────────────────────── */}
      <section className="mx-auto max-w-7xl px-5 py-24 md:py-40 lg:px-8">
        <motion.div className="max-w-2xl" {...rise(0)}>
          <SectionHeading eyebrow={m["why.eyebrow"]()} title={m["why.title"]()} />
        </motion.div>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {WHY_CARDS.map((c, i) => (
            <motion.div key={i} {...rise(i * 90)}>
              <WashCard tone={i === 1 ? "mint" : "paper"} className="h-full p-8">
                <h3 className="font-display text-2xl font-semibold text-ink">{c.t()}</h3>
                <p className="mt-3 text-[14px] leading-relaxed text-ink-2">{c.d()}</p>
              </WashCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────── */}
      <section id="pricing" className="scroll-mt-24 bg-surface-dim/50 py-24 md:py-40">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <motion.div className="mx-auto max-w-2xl" {...rise(0)}>
            <SectionHeading
              eyebrow={m["pricing.eyebrow"]()}
              title={m["pricing.title"]()}
              lede={m["pricing.sub"]()}
              align="center"
            />
          </motion.div>
          <div className="mx-auto mt-14 grid max-w-4xl gap-5 md:grid-cols-3">
            {PRICING_CARDS.map((c, i) => (
              <motion.div key={i} {...rise(i * 90)}>
                <WashCard tone="paper" className="h-full border-line bg-surface p-8">
                  <span className="font-display text-4xl font-semibold text-ink">{c.p()}</span>
                  <h3 className="mt-4 text-[15px] font-semibold text-ink">{c.t()}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">{c.d()}</p>
                </WashCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-5 py-24 md:py-40">
        <motion.div {...rise(0)}>
          <SectionHeading eyebrow={m["faq.eyebrow"]()} title={m["faq.title"]()} align="center" />
        </motion.div>
        <div className="mt-12 space-y-3">
          {FAQ_ITEMS.map((f, i) => (
            <motion.details
              key={i}
              className="group rounded-card border border-line bg-surface transition-colors open:border-ink/20"
              {...rise(i * 70)}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-5 text-[15px] font-medium text-ink marker:hidden [&::-webkit-details-marker]:hidden">
                {f.q()}
                <span className="ml-4 flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-dim text-ink-2 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-open:rotate-45">
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </summary>
              <p className="px-6 pb-5 text-[14px] leading-relaxed text-ink-2">{f.a()}</p>
            </motion.details>
          ))}
        </div>
      </section>

      {/* ── Final CTA band ───────────────────────────────── */}
      <section className="px-5 pb-24 md:pb-36 lg:px-8">
        <motion.div className="mx-auto max-w-7xl" {...rise(0)}>
          <WashCard tone="lavender" className="rounded-card px-8 py-16 text-center md:py-24">
            <h2 className="mx-auto max-w-xl font-display text-[clamp(2.5rem,5vw,4.5rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-ink">
              {m["cta.title"]()}
            </h2>
            <p className="mx-auto mt-5 max-w-md font-body text-lg text-ink-2">{m["cta.sub"]()}</p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <HeroButton variant="primary" href="/login" size="lg">
                {m["hero.cta"]()}
              </HeroButton>
              <HeroButton variant="ghost" href={calendarHref()} size="lg">
                {m["hero.ctaGhost"]()}
              </HeroButton>
            </div>
          </WashCard>
        </motion.div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="border-t border-line px-5 py-10 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/mark.png" alt="" className="h-5 w-5 rounded-[5px]" />
            <span className="font-display text-lg text-ink">tarima</span>
            <span className="ml-3 text-[13px] text-ink-3">{m["footer.tag"]()}</span>
          </div>
          <div className="flex items-center gap-5 text-[13px] text-ink-2">
            <a href={calendarHref()} className="transition-colors hover:text-ink">
              {m["footer.contact"]()}
            </a>
            <span className="text-ink-3">{m["footer.rights"]({ year: "2026" })}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
