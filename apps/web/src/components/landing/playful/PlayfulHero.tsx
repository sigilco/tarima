import { MarkerHighlight } from './MarkerHighlight'
import { ScribbleUnderline } from './ScribbleUnderline'
import { WavyUnderline } from './WavyUnderline'
import { RatingBar } from './RatingBar'
import { PhoneMockup } from './PhoneMockup'
import { PhoneChatDemo } from './PhoneChatDemo'
import { ArrowRightIcon, ChevronRightIcon } from './icons'
import type { RefObject } from 'react'

export type PlayfulHeroRefs = {
  leftRef: RefObject<HTMLDivElement | null>
  titleRef: RefObject<HTMLHeadingElement | null>
  phoneBoxRef: RefObject<HTMLDivElement | null>
  phoneRef: RefObject<HTMLDivElement | null>
}

type PlayfulHeroProps = {
  refs?: PlayfulHeroRefs
  headline?: [string, string, string]
  markerText?: string
  scribbleText?: string
  subtitle?: string[]
  discountText?: string
  ctaLabel?: string
  onCtaClick?: () => void
  ghostLabel?: string
  onGhostClick?: () => void
  rating?: string
  downloads?: string
  onIslandClick?: () => void
}

export function PlayfulHero({
  refs,
  headline = ['Your favourite', 'is now', 'available for mobile'],
  markerText = 'productivity tool',
  scribbleText = 'available for mobile',
  subtitle = [
    'Aceternity AI bring you the best productivity tools for your desktop, now available on mobile. Download the app now to avail additional',
    'and take your productivity to the next level.',
  ],
  discountText = '20% discount',
  ctaLabel = 'Get the app',
  onCtaClick,
  ghostLabel = 'Read changelog',
  onGhostClick,
  rating = '4.9 / 5.0',
  downloads = 'Over 50,000+ early downloads across iOS & Android',
  onIslandClick,
}: PlayfulHeroProps) {
  return (
    <div className="grid w-full max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
      {/* Left Column: Copy & Actions */}
      <div ref={refs?.leftRef} className="flex max-w-2xl flex-col items-start lg:col-span-7">
        {/* Big Bold Title with Marker Accents */}
        <h1
          ref={refs?.titleRef}
          className="text-4xl font-black leading-[1.08] tracking-tight text-neutral-900 sm:text-6xl lg:text-[4.25rem]"
        >
          {headline[0]}
          <br className="hidden sm:inline" />
          <MarkerHighlight>{markerText}</MarkerHighlight>
          {headline[1]}
          <br className="hidden sm:inline" />
          <span className="relative mt-1 inline-block sm:mt-0">
            {scribbleText || headline[2]}
            {/* Hand-drawn yellow marker underline */}
            <ScribbleUnderline />
          </span>
        </h1>

        {/* Subtitle with Discount Highlight */}
        <p className="mt-8 max-w-xl text-base font-normal leading-relaxed text-neutral-500 sm:text-lg">
          {subtitle[0]}{' '}
          <span className="relative inline-block font-medium text-neutral-800">
            {discountText}
            {/* Subtitle wavy marker underline */}
            <WavyUnderline />
          </span>{' '}
          {subtitle[1]}
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-wrap items-center gap-5 sm:gap-6">
          <button
            onClick={onCtaClick}
            className="flex items-center gap-2 rounded-xl bg-[#FACC15] px-6 py-3.5 text-sm font-bold text-neutral-950 shadow-sm transition-all hover:bg-[#EAB308] hover:shadow-md active:scale-[0.98]"
          >
            <span>{ctaLabel}</span>
            <ArrowRightIcon className="h-4 w-4" />
          </button>

          <button
            onClick={onGhostClick}
            className="group flex items-center gap-1.5 px-2 py-2 text-sm font-semibold text-neutral-800 transition-colors hover:text-black"
          >
            <span>{ghostLabel}</span>
            <ChevronRightIcon className="h-4 w-4 text-neutral-400 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* Rating & User Feedback Bar */}
        <RatingBar rating={rating} downloads={downloads} />
      </div>

      {/* Right Column: iPhone 15 Pro Mockup */}
      <div className="flex justify-center lg:col-span-5 lg:justify-end">
        <PhoneMockup
          ref={refs?.phoneRef}
          boxRef={refs?.phoneBoxRef}
          onIslandClick={onIslandClick}
        >
          <PhoneChatDemo />
        </PhoneMockup>
      </div>
    </div>
  )
}
