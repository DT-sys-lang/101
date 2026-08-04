'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { OptimizedImage as Image } from '@/components/ui/optimized-image'
import { cn } from '@/lib/utils'
import { homeHeroOverlaySlides } from './home-hero-overlay.config'
import { HomeHeroOverlayPresence } from './home-hero-overlay'

export type HomeHeroSlide =
  | {
      readonly kind: 'image'
      readonly src: string
    }
  | {
      readonly kind: 'video'
      readonly src: string
      readonly poster: string
    }

export function HomeHeroCarousel({
  slides,
}: {
  readonly slides: readonly HomeHeroSlide[]
}) {
  const [activeIndex, setActiveIndex] = useAutoplayIndex(slides.length)
  const [readyVideoSrcs, setReadyVideoSrcs] = useState<ReadonlySet<string>>(() => new Set())
  const carouselT = useTranslations('home.hero.carousel')
  const storyT = useTranslations('home.hero.story')
  const slideCount = slides.length

  if (!slideCount) {
    return null
  }

  const showPrevious = () => setActiveIndex((current) => (current - 1 + slideCount) % slideCount)
  const showNext = () => setActiveIndex((current) => (current + 1) % slideCount)
  const markVideoReady = (src: string) => {
    setReadyVideoSrcs((current) => {
      if (current.has(src)) {
        return current
      }

      const next = new Set(current)
      next.add(src)
      return next
    })
  }

  return (
    <section className="group relative mx-auto h-[clamp(260px,34vw,520px)] w-full max-w-[1440px] overflow-hidden bg-black" id="hero-carousel" aria-label={carouselT('ariaLabel')}>
      {slides.map((slide, index) => {
        const active = index === activeIndex
        const overlayConfig = homeHeroOverlaySlides[index]
        const slideLabel = overlayConfig ? storyT(`${overlayConfig.translationKey}.${overlayConfig.mediaLabelKey}`) : ''
        const videoReady = slide.kind === 'video' && readyVideoSrcs.has(slide.src)

        return (
          <div
            key={slide.src}
            aria-hidden={!active}
            className={cn('absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none', active ? 'opacity-100' : 'pointer-events-none opacity-0')}
          >
            <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/40 via-transparent to-black/40" />
            {slide.kind === 'video' ? (
              <>
                <Image src={slide.poster} alt={active ? slideLabel : ''} fill preload={index === 0} sizes="100vw" className="object-cover" />
                {active ? (
                  <video
                    key={slide.src}
                    aria-label={slideLabel}
                    autoPlay
                    className={cn('absolute inset-0 h-full w-full object-cover transition-opacity duration-500 motion-reduce:transition-none', videoReady ? 'opacity-100' : 'opacity-0')}
                    disablePictureInPicture
                    loop
                    muted
                    playsInline
                    poster={slide.poster}
                    preload="auto"
                    onCanPlay={() => markVideoReady(slide.src)}
                    onLoadedData={() => markVideoReady(slide.src)}
                  >
                    <source src={slide.src} type="video/mp4" />
                  </video>
                ) : null}
              </>
            ) : (
              <Image src={slide.src} alt={active ? slideLabel : ''} fill preload={index === 0} sizes="100vw" className="object-cover" />
            )}
          </div>
        )
      })}

      <HomeHeroOverlayPresence activeIndex={activeIndex} />

      {slideCount > 1 ? (
        <div className="absolute right-4 top-1/2 z-30 flex -translate-y-1/2 flex-col items-center gap-2 sm:right-6 lg:right-8">
          <button
            aria-label={carouselT('previousLabel')}
            className="grid size-10 place-items-center border border-white/60 bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-[#111820] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            title={carouselT('previousLabel')}
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
            aria-label={carouselT('nextLabel')}
            className="grid size-10 place-items-center border border-white/60 bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-[#111820] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            title={carouselT('nextLabel')}
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
