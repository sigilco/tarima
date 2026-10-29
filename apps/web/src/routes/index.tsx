import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import * as m from '../paraglide/messages.js'
import { PlayfulHero, type PlayfulHeroCopy } from '../components/landing/playful/PlayfulHero'
import { MinimalFooter } from '../components/landing/playful/MinimalFooter'
import { Toast } from '../components/landing/playful/Toast'
import { ChangelogModal, type ChangelogCopy } from '../components/landing/playful/ChangelogModal'
import { useFitToViewport } from '../components/landing/playful/useFitToViewport'

export const Route = createFileRoute('/')({ component: PlayfulLanding })

const HERO_COPY: PlayfulHeroCopy = {
  headlineLine1: m['playful.headline.line1'](),
  headlineMarker: m['playful.headline.marker'](),
  headlineLine2: m['playful.headline.line2'](),
  headlineScribble: m['playful.headline.scribble'](),
  subtitleBefore: m['playful.subtitle.before'](),
  subtitleHighlight: m['playful.subtitle.highlight'](),
  subtitleAfter: m['playful.subtitle.after'](),
  ctaLabel: m['playful.cta.label'](),
  ghostLabel: m['playful.ghost.label'](),
  rating: m['playful.rating.value'](),
  downloads: m['playful.rating.downloads']({ count: 50000 }),
  statusTime: m['playful.phone.statusTime'](),
  phone: {
    userMessage: m['playful.phone.userMessage'](),
    userMeta: m['playful.phone.userMeta'](),
    agentMessage: m['playful.phone.agentMessage'](),
    agentMeta: m['playful.phone.agentMeta'](),
    galleryImages: [
      {
        src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',
        alt: m['playful.phone.gallery.beachAlt'](),
        chip: m['playful.phone.gallery.beachChip'](),
      },
      {
        src: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=400&q=80',
        alt: m['playful.phone.gallery.sunsetAlt'](),
        chip: m['playful.phone.gallery.sunsetChip'](),
      },
    ],
    quickPrompts: [
      { label: m['playful.phone.prompt.summarize'](), text: m['playful.phone.prompt.summarizeText']() },
      { label: m['playful.phone.prompt.export'](), text: m['playful.phone.prompt.exportText']() },
    ],
    inputPlaceholder: m['playful.phone.inputPlaceholder'](),
    replyDefault: m['playful.phone.reply.default'](),
    replyMeetings: m['playful.phone.reply.meetings'](),
    replyTrip: m['playful.phone.reply.trip'](),
    replyMeta: m['playful.phone.replyMeta'](),
  },
}

const CHANGELOG_COPY: ChangelogCopy = {
  version: m['playful.changelog.version'](),
  date: m['playful.changelog.date'](),
  title: m['playful.changelog.title'](),
  closeLabel: m['playful.changelog.close'](),
  features: [
    { title: m['playful.changelog.f1.t'](), text: m['playful.changelog.f1.d']() },
    { title: m['playful.changelog.f2.t'](), text: m['playful.changelog.f2.d']() },
    { title: m['playful.changelog.f3.t'](), text: m['playful.changelog.f3.d']() },
  ],
}

const FOOTER_LINKS = [
  { label: m['playful.footer.privacy'](), href: '#' },
  { label: m['playful.footer.terms'](), href: '#' },
  { label: m['playful.footer.docs'](), href: '#' },
]

function PlayfulLanding() {
  const [toastMessage, setToastMessage] = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const [changelogOpen, setChangelogOpen] = useState(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { mainRef, footerRef, leftRef, titleRef, phoneBoxRef, phoneRef } =
    useFitToViewport()

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
  }, [])

  const showToast = (message: string) => {
    setToastMessage(message)
    setToastVisible(true)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastVisible(false), 3500)
  }

  return (
    <div className="playful-root flex min-h-screen flex-col justify-between bg-[#FAFAFA] text-neutral-900 antialiased selection:bg-[#FACC15] selection:text-black">
      {/* Hero Section */}
      <main
        ref={mainRef}
        className="flex w-full flex-1 items-center justify-center overflow-hidden px-6 py-8 lg:py-16"
      >
        <PlayfulHero
          refs={{ leftRef, titleRef, phoneBoxRef, phoneRef }}
          copy={HERO_COPY}
          onCtaClick={() => showToast(m['playful.toast.cta']())}
          onGhostClick={() => setChangelogOpen(true)}
          onIslandClick={() => showToast(m['playful.toast.island']())}
        />
      </main>

      <MinimalFooter
        ref={footerRef}
        copyright={m['playful.footer.copyright']()}
        links={FOOTER_LINKS}
      />

      <Toast message={toastMessage} visible={toastVisible} />
      <ChangelogModal
        open={changelogOpen}
        onClose={() => setChangelogOpen(false)}
        copy={CHANGELOG_COPY}
      />
    </div>
  )
}
