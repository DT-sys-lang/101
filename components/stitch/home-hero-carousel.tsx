'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export type HomeHeroSlide =
  | {
      readonly kind: 'image'
      readonly src: string
      readonly label: string
    }
  | {
      readonly kind: 'video'
      readonly src: string
      readonly poster: string
      readonly label: string
    }

export function HomeHeroCarousel({
  ariaLabel,
  nextLabel,
  previousLabel,
  slides,
}: {
  readonly ariaLabel: string
  readonly nextLabel: string
  readonly previousLabel: string
  readonly slides: readonly HomeHeroSlide[]
}) {
  const [activeIndex, setActiveIndex] = useAutoplayIndex(slides.length)
  const slideCount = slides.length

  if (!slideCount) {
    return null
  }

  const showPrevious = () => setActiveIndex((current) => (current - 1 + slideCount) % slideCount)
  const showNext = () => setActiveIndex((current) => (current + 1) % slideCount)

  return (
    <section className="group relative mx-auto h-[clamp(260px,34vw,520px)] w-full max-w-[1440px] overflow-hidden bg-black" id="hero-carousel" aria-label={ariaLabel}>
      {slides.map((slide, index) => {
        const active = index === activeIndex

        return (
          <div
            key={slide.src}
            aria-hidden={!active}
            className={cn('absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none', active ? 'opacity-100' : 'pointer-events-none opacity-0')}
          >
            <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/40 via-transparent to-black/40" />
            {slide.kind === 'video' ? (
              <video
                aria-label={slide.label}
                autoPlay
                className="h-full w-full object-cover"
                disablePictureInPicture
                loop
                muted
                playsInline
                poster={slide.poster}
                preload="metadata"
              >
                <source src={slide.src} type="video/mp4" />
              </video>
            ) : (
              <Image src={slide.src} alt={active ? slide.label : ''} fill priority={index === 0} sizes="100vw" className="object-cover" />
            )}
          </div>
        )
      })}

      {slideCount > 1 ? (
        <div className="absolute right-4 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center gap-2 sm:right-6 lg:right-8">
          <button
            aria-label={previousLabel}
            className="grid size-10 place-items-center border border-white/60 bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-[#111820] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            title={previousLabel}
            type="button"
            onClick={showPrevious}
          >
            <ChevronUp className="size-5" aria-hidden="true" />
          </button>
          <div className="grid min-h-12 min-w-10 place-items-center border border-white/35 bg-black/45 px-2 font-mono text-[11px] font-semibold leading-5 text-white backdrop-blur-sm" aria-live="polite">
            {String(activeIndex + 1).padStart(2, '0')}
            <span className="block text-white/55">/ {String(slideCount).padStart(2, '0')}</span>
          </div>
          <button
            aria-label={nextLabel}
            className="grid size-10 place-items-center border border-white/60 bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-[#111820] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            title={nextLabel}
            type="button"
            onClick={showNext}
          >
            <ChevronDown className="size-5" aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </section>
  )
}

function useAutoplayIndex(slideCount: number) {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (slideCount < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined
    }

    const intervalId = window.setInterval(() => setActiveIndex((current) => (current + 1) % slideCount), 7000)
    return () => window.clearInterval(intervalId)
  }, [slideCount])

  return [activeIndex, setActiveIndex] as const
}
