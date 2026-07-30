'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { homeHeroOverlaySlides, type HomeHeroOverlayConfig } from './home-hero-overlay.config'

export function HomeHeroOverlayPresence({
  activeIndex,
}: {
  readonly activeIndex: number
}) {
  const config = homeHeroOverlaySlides[activeIndex]

  if (!config) {
    return null
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <HomeHeroOverlay key={config.id} config={config} />
    </AnimatePresence>
  )
}

function HomeHeroOverlay({
  config,
}: {
  readonly config: HomeHeroOverlayConfig
}) {
  const t = useTranslations('home.hero.story')
  const prefersReducedMotion = useReducedMotion()
  const baseKey = config.translationKey
  const helperText = t(`${baseKey}.${config.helperTextKey}`)

  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-20"
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, transition: { duration: 0.24, ease: 'easeOut' } }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: 'easeOut' }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-black/58 via-black/20 to-transparent sm:from-black/52 sm:via-black/18" aria-hidden="true" />
      <div className={cn('absolute z-10 text-white', config.contentClassName)}>
        <motion.p className="text-[11px] font-semibold uppercase leading-4 text-white/70 sm:text-xs" {...softReveal(prefersReducedMotion, 0.02, 6, 0.7)}>
          {t(`${baseKey}.eyebrow`)}
        </motion.p>
        <motion.h2
          className="mt-2 text-[clamp(2rem,10vw,5.25rem)] font-semibold uppercase leading-[0.96] text-white sm:text-[clamp(3rem,6vw,5.25rem)]"
          {...softReveal(prefersReducedMotion, config.animation?.titleDelay ?? 0.08, 8, 0.86)}
        >
          {t(`${baseKey}.${config.titleKey}`)}
        </motion.h2>
        <motion.p
          className="mt-4 max-w-[34rem] text-base font-medium leading-6 text-white/82 sm:text-xl sm:leading-8 lg:text-2xl lg:leading-9"
          {...softReveal(prefersReducedMotion, config.animation?.subtitleDelay ?? 0.22, 8, 0.78)}
        >
          {t(`${baseKey}.${config.subtitleKey}`)}
        </motion.p>
        {config.presentation === 'inline' ? (
          <InlineTags config={config} helperText={helperText} prefersReducedMotion={prefersReducedMotion} />
        ) : null}
      </div>

      {config.presentation === 'spatial' ? (
        <SpatialTags config={config} helperText={helperText} prefersReducedMotion={prefersReducedMotion} />
      ) : null}
    </motion.div>
  )
}

function InlineTags({
  config,
  helperText,
  prefersReducedMotion,
}: {
  readonly config: HomeHeroOverlayConfig
  readonly helperText: string
  readonly prefersReducedMotion: boolean | null
}) {
  const t = useTranslations('home.hero.story')
  const baseKey = config.translationKey

  return (
    <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-white/76 sm:mt-6 sm:gap-x-6" aria-label={helperText}>
      {config.tags.map((tag, index) => (
        <TagItem
          key={tag.key}
          className={cn(index >= (config.maxMobileTags ?? config.tags.length) && 'max-sm:hidden')}
          delay={(config.animation?.tagDelay ?? 0.44) + index * (config.animation?.tagStagger ?? 0.18)}
          label={t(`${baseKey}.tags.${tag.key}`)}
          prefersReducedMotion={prefersReducedMotion}
        />
      ))}
    </ul>
  )
}

function SpatialTags({
  config,
  helperText,
  prefersReducedMotion,
}: {
  readonly config: HomeHeroOverlayConfig
  readonly helperText: string
  readonly prefersReducedMotion: boolean | null
}) {
  const t = useTranslations('home.hero.story')
  const baseKey = config.translationKey

  return (
    <ul className="absolute inset-0 z-10" aria-label={helperText}>
      {config.tags.map((tag, index) => (
        <TagItem
          key={tag.key}
          className={cn(
            'absolute',
            tag.position?.desktop,
            tag.position?.mobile,
            tag.showOnMobile === false && 'max-sm:hidden',
          )}
          delay={(config.animation?.tagDelay ?? 0.68) + index * (config.animation?.tagStagger ?? 0.58)}
          label={t(`${baseKey}.tags.${tag.key}`)}
          prefersReducedMotion={prefersReducedMotion}
          spatial
        />
      ))}
    </ul>
  )
}

function TagItem({
  className,
  delay,
  label,
  prefersReducedMotion,
  spatial = false,
}: {
  readonly className?: string
  readonly delay: number
  readonly label: string
  readonly prefersReducedMotion: boolean | null
  readonly spatial?: boolean
}) {
  return (
    <motion.li
      className={cn(
        'inline-flex items-center gap-2 whitespace-nowrap text-[11px] font-medium leading-5 text-white/78 sm:text-xs',
        spatial && 'text-xs text-white/72 sm:text-sm',
        className,
      )}
      {...softReveal(prefersReducedMotion, delay, 4, spatial ? 0.72 : 0.58)}
    >
      <span className="text-[#4DA3FF]" aria-hidden="true">
        ●
      </span>
      <span>{label}</span>
    </motion.li>
  )
}

function softReveal(prefersReducedMotion: boolean | null, delay: number, y: number, duration: number) {
  if (prefersReducedMotion) {
    return {
      initial: { opacity: 1, y: 0 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 0 },
      transition: { duration: 0 },
    }
  }

  return {
    initial: { opacity: 0, y },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -2 },
    transition: { duration, delay, ease: 'easeOut' as const },
  }
}
