import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import * as m from '../paraglide/messages.js'
import { Nav } from '../components/Nav'
import { Reveal } from '../components/Reveal'
import { AccessForm } from '../components/AccessForm'
import { AgentBoard } from '../components/AgentBoard'

export const Route = createFileRoute('/')({ component: Landing })

const HOW_STEPS = [
  { t: m['how.s1t'], d: m['how.s1d'] },
  { t: m['how.s2t'], d: m['how.s2d'] },
  { t: m['how.s3t'], d: m['how.s3d'] },
  { t: m['how.s4t'], d: m['how.s4d'] },
]

const WHY_CARDS = [
  { t: m['why.c1t'], d: m['why.c1d'] },
  { t: m['why.c2t'], d: m['why.c2d'] },
  { t: m['why.c3t'], d: m['why.c3d'] },
]

const PRICING_CARDS = [
  { p: m['pricing.card1p'], t: m['pricing.card1t'], d: m['pricing.card1d'] },
  { p: m['pricing.card2p'], t: m['pricing.card2t'], d: m['pricing.card2d'] },
  { p: m['pricing.card3p'], t: m['pricing.card3t'], d: m['pricing.card3d'] },
]

const FAQ_ITEMS = [
  { q: m['faq.q1'], a: m['faq.a1'] },
  { q: m['faq.q2'], a: m['faq.a2'] },
  { q: m['faq.q3'], a: m['faq.a3'] },
  { q: m['faq.q4'], a: m['faq.a4'] },
]

function Eyebrow({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-ink/[0.05] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-ink-2 ring-1 ring-ink/10">
      {children}
    </span>
  )
}

function Landing() {
  const [job, setJob] = useState<'venues' | 'sponsors'>('venues')

  return (
    <div className="grain min-h-[100dvh] overflow-x-clip bg-paper text-ink">
      <Nav />

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-5 pb-20 pt-32 md:pt-40 lg:px-8">
        <div className="grid min-w-0 items-center gap-14 lg:grid-cols-2 lg:gap-10">
          <Reveal className="min-w-0">
            <Eyebrow>{m['hero.eyebrow']()}</Eyebrow>
            <h1 className="mt-6 font-display text-[2.9rem] leading-[1.02] tracking-[-0.01em] text-ink md:text-[4.3rem]">
              {m['hero.titlePre']()}{' '}
              <em className="text-clay">{m['hero.titleAccent']()}</em>{' '}
              {m['hero.titlePost']()}
            </h1>
            <p className="mt-6 max-w-md text-[17px] leading-relaxed text-ink-2">
              {m['hero.sub']()}
            </p>
            <div id="access" className="mt-8 scroll-mt-28">
              <AccessForm />
            </div>
            <p className="mt-4 text-[13px] text-ink-3">{m['hero.note']()}</p>
          </Reveal>

          <Reveal delay={150} className="min-w-0">
            <AgentBoard brief={m['board.brief']()} />
          </Reveal>
        </div>
      </section>

      {/* ── Two jobs ─────────────────────────────────────── */}
      <section id="jobs" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-24 md:py-36 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Eyebrow>{m['jobs.eyebrow']()}</Eyebrow>
          <h2 className="mt-6 font-display text-4xl leading-[1.05] text-ink md:text-[3.4rem]">
            {m['jobs.titlePre']()}{' '}
            <em className="text-clay">{m['jobs.titleAccent']()}</em>
          </h2>
          <p className="mt-5 text-[16px] leading-relaxed text-ink-2">{m['jobs.sub']()}</p>
        </Reveal>

        <Reveal delay={120} className="mt-12">
          <div className="mx-auto max-w-full overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="mx-auto flex w-max items-center gap-1 rounded-full bg-ink/[0.05] p-1 ring-1 ring-ink/10 max-[420px]:w-full max-[420px]:rounded-[1.6rem]">
              {(['venues', 'sponsors'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setJob(v)}
                  className={`whitespace-nowrap rounded-full px-5 py-2.5 text-[13px] font-medium leading-snug transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] max-[420px]:flex-1 max-[420px]:whitespace-normal max-[420px]:px-3 max-[420px]:py-3 ${
                    job === v ? 'bg-ink text-paper shadow-sm' : 'text-ink-2 hover:text-ink'
                  }`}
                >
                  {v === 'venues' ? m['jobs.tab1']() : m['jobs.tab2']()}
                </button>
              ))}
            </div>
          </div>
          <p className="mx-auto mt-5 max-w-xl text-center text-[15px] leading-relaxed text-ink-2">
            {job === 'venues' ? m['jobs.tab1desc']() : m['jobs.tab2desc']()}
          </p>
          <div className="mx-auto mt-10 min-w-0 max-w-4xl">
            <AgentBoard
              key={job}
              variant={job}
              brief={
                job === 'venues'
                  ? m['board.brief']()
                  : m['board.briefSponsors']()
              }
            />
          </div>
        </Reveal>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section id="how" className="scroll-mt-24 bg-paper-2/60 py-24 md:py-36">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <Reveal className="max-w-2xl">
            <Eyebrow>{m['how.eyebrow']()}</Eyebrow>
            <h2 className="mt-6 font-display text-4xl leading-[1.05] text-ink md:text-[3.4rem]">
              {m['how.titlePre']()}{' '}
              <em className="text-clay">{m['how.titleAccent']()}</em>{' '}
              {m['how.titlePost']()}
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {HOW_STEPS.map((s, i) => (
              <Reveal key={i} delay={i * 90}>
                <div className="h-full rounded-[1.6rem] bg-white/70 p-1.5 ring-1 ring-ink/10">
                  <div className="flex h-full flex-col rounded-[calc(1.6rem-0.375rem)] bg-paper p-6">
                    <span className="font-display text-[2rem] leading-none text-clay">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className="mt-5 text-[15px] font-semibold text-ink">
                      {s.t()}
                    </h3>
                    <p className="mt-2.5 text-[13.5px] leading-relaxed text-ink-2">
                      {s.d()}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why / differentiation ────────────────────────── */}
      <section className="mx-auto max-w-7xl px-5 py-24 md:py-36 lg:px-8">
        <Reveal className="max-w-2xl">
          <Eyebrow>{m['why.eyebrow']()}</Eyebrow>
          <h2 className="mt-6 font-display text-4xl leading-[1.05] text-ink md:text-[3.4rem]">
            {m['why.titlePre']()}{' '}
            <em className="text-clay">{m['why.titleAccent']()}</em>
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {WHY_CARDS.map((c, i) => (
            <Reveal key={i} delay={i * 90} className={i === 0 ? 'md:-rotate-1' : i === 2 ? 'md:rotate-1' : ''}>
              <div className="h-full rounded-[1.6rem] bg-ink/[0.045] p-1.5 ring-1 ring-ink/10">
                <div className="flex h-full flex-col rounded-[calc(1.6rem-0.375rem)] bg-white p-7">
                  <h3 className="font-display text-2xl text-ink">
                    {c.t()}
                  </h3>
                  <p className="mt-3 text-[14px] leading-relaxed text-ink-2">
                    {c.d()}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Proof / transcript ───────────────────────────── */}
      <section className="mx-auto max-w-7xl px-5 pb-24 md:pb-36 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <Eyebrow>{m['proof.eyebrow']()}</Eyebrow>
            <h2 className="mt-6 font-display text-4xl leading-[1.05] text-ink md:text-[3.4rem]">
              {m['proof.title']()}
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <div className="rounded-[1.6rem] bg-ink/[0.045] p-1.5 ring-1 ring-ink/10">
              <div className="rounded-[calc(1.6rem-0.375rem)] bg-ink p-7 text-paper md:p-9">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-paper/50">
                  {m['proof.transcriptLead']()}
                </p>
                <div className="mt-5 space-y-4 font-display text-[1.35rem] leading-snug text-paper/90">
                  <p>{m['proof.t1']()}</p>
                  <p className="text-paper/70">{m['proof.t2']()}</p>
                  <p className="text-paper/55">{m['proof.t3']()}</p>
                </div>
                <p className="mt-6 text-[12px] text-paper/40">{m['proof.note']()}</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────── */}
      <section id="pricing" className="scroll-mt-24 bg-paper-2/60 py-24 md:py-36">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <Eyebrow>{m['pricing.eyebrow']()}</Eyebrow>
            <h2 className="mt-6 font-display text-4xl leading-[1.05] text-ink md:text-[3.4rem]">
              {m['pricing.title']()}
            </h2>
            <p className="mt-5 text-[16px] leading-relaxed text-ink-2">{m['pricing.sub']()}</p>
          </Reveal>
          <div className="mx-auto mt-14 grid max-w-4xl gap-5 md:grid-cols-3">
            {PRICING_CARDS.map((c, i) => (
              <Reveal key={i} delay={i * 90}>
                <div className="h-full rounded-[1.6rem] bg-ink/[0.045] p-1.5 ring-1 ring-ink/10">
                  <div className="flex h-full flex-col rounded-[calc(1.6rem-0.375rem)] bg-white p-7">
                    <span className="font-display text-[2.4rem] leading-none text-ink">
                      {c.p()}
                    </span>
                    <h3 className="mt-4 text-[15px] font-semibold text-ink">
                      {c.t()}
                    </h3>
                    <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">
                      {c.d()}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-5 py-24 md:py-36">
        <Reveal className="text-center">
          <Eyebrow>{m['faq.eyebrow']()}</Eyebrow>
        </Reveal>
        <div className="mt-12 space-y-3">
          {FAQ_ITEMS.map((f, i) => (
            <Reveal key={i} delay={i * 70}>
              <details className="group rounded-2xl bg-ink/[0.04] ring-1 ring-ink/10 transition-colors open:bg-white">
                <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-4.5 text-[15px] font-medium text-ink marker:hidden [&::-webkit-details-marker]:hidden">
                  {f.q()}
                  <span className="ml-4 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink/[0.06] text-ink-2 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-open:rotate-45">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </summary>
                <p className="px-6 pb-5 text-[14px] leading-relaxed text-ink-2">
                  {f.a()}
                </p>
              </details>
            </Reveal>
          ))}
        </div>
        <Reveal delay={200} className="mt-16 text-center">
          <AccessForm compact />
        </Reveal>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="border-t border-line px-5 py-10 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/mark.png" alt="" className="h-5 w-5 rounded-[5px]" />
            <span className="font-display text-lg text-ink">tarima</span>
            <span className="ml-3 text-[13px] text-ink-3">{m['footer.tag']()}</span>
          </div>
          <div className="flex items-center gap-5 text-[13px] text-ink-2">
            <a href="mailto:hello@tarima.events" className="transition-colors hover:text-ink">
              {m['footer.contact']()}
            </a>
            <span className="text-ink-3">{m['footer.rights']({ year: '2026' })}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
