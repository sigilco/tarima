import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { PlayfulHero } from '../components/landing/playful/PlayfulHero'
import { MinimalFooter } from '../components/landing/playful/MinimalFooter'
import { Toast } from '../components/landing/playful/Toast'
import { ChangelogModal } from '../components/landing/playful/ChangelogModal'

export const Route = createFileRoute('/')({ component: PlayfulLanding })

function PlayfulLanding() {
  const [toastMessage, setToastMessage] = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const [changelogOpen, setChangelogOpen] = useState(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

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
      <main className="flex w-full flex-1 items-center justify-center overflow-hidden px-6 py-8 lg:py-16">
        <PlayfulHero
          onCtaClick={() => showToast('Redirecting to the iOS App Store & Google Play...')}
          onGhostClick={() => setChangelogOpen(true)}
          onIslandClick={() =>
            showToast('⚡ Dynamic Island: Aceternity AI is running active background tasks.')
          }
        />
      </main>

      <MinimalFooter />

      <Toast message={toastMessage} visible={toastVisible} />
      <ChangelogModal open={changelogOpen} onClose={() => setChangelogOpen(false)} />
    </div>
  )
}
