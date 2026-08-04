'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Locale } from '@/i18n/routing'
import type { HomepageProjection } from '@/lib/domain'
import { cn } from '@/lib/utils'

export function HeroMediaCarousel({
  hero,
}: {
  locale: Locale
  hero: HomepageProjection['hero']
}) {
  const [activeIndex, setActiveIndex] = useAutoplayIndex(hero.media.slides.length)
  const activeSlide = hero.media.slides[activeIndex] ?? hero.media.slides[0]
  const slideCount = hero.media.slides.length

  if (!activeSlide) {
    return null
  }

  const showPrevious = () => setActiveIndex((current) => (current - 1 + slideCount) % slideCount)
  const showNext = () => setActiveIndex((current) => (current + 1) % slideCount)

  return (
    <section className="relative isolate h-[320px] overflow-hidden bg-steel-900 sm:h-[400px] lg:h-[460px] xl:h-[500px]" aria-label={hero.media.ariaLabel}>
      <div className="absolute inset-0">
        {hero.media.slides.map((slide, index) => (
          <div key={`${slide.title}-${slide.imageSrc}`} aria-hidden={index !== activeIndex} className={cn('absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none', index === activeIndex ? 'opacity-100' : 'pointer-events-none opacity-0')}>
            <Image
              src={slide.imageSrc}
              alt={index === activeIndex ? slide.imageAlt : ''}
              fill
              preload={index === 0}
              loading={index === 0 ? undefined : 'lazy'}
              sizes="100vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0 border-y border-white/15" aria-hidden="true" />

      {slideCount > 1 ? (
        <div className="absolute bottom-5 right-5 z-10 flex items-center gap-2 sm:bottom-6 sm:right-6 lg:right-8">
          <div className="hidden h-9 items-center border border-white/40 bg-steel-900/75 px-3 font-mono text-[11px] font-semibold text-white backdrop-blur-sm sm:flex" aria-live="polite">
            {String(activeIndex + 1).padStart(2, '0')} / {String(slideCount).padStart(2, '0')}
          </div>
          <button aria-label={hero.media.previousLabel} title={hero.media.previousLabel} className="grid size-9 place-items-center border border-white/60 bg-steel-900/70 text-white backdrop-blur-sm transition-colors duration-200 hover:bg-white hover:text-steel-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-steel-900" type="button" onClick={showPrevious}>
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          <button aria-label={hero.media.nextLabel} title={hero.media.nextLabel} className="grid size-9 place-items-center border border-white/60 bg-steel-900/70 text-white backdrop-blur-sm transition-colors duration-200 hover:bg-white hover:text-steel-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-steel-900" type="button" onClick={showNext}>
            <ChevronRight className="size-4" aria-hidden="true" />
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

    const intervalId = window.setInterval(() => setActiveIndex((current) => (current + 1) % slideCount), 6200)
    return () => window.clearInterval(intervalId)
  }, [slideCount])

  return [activeIndex, setActiveIndex] as const
}
