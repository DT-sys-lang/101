'use client'

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

  return <HomeHeroOverlay key={config.id} config={config} />
}

function HomeHeroOverlay({
  config,
}: {
  readonly config: HomeHeroOverlayConfig
}) {
  const t = useTranslations('home.hero.story')
  const baseKey = config.translationKey
  const helperText = t(`${baseKey}.${config.helperTextKey}`)

  return (
    <div className="pointer-events-none absolute inset-0 z-20 hero-fade-in">
      <div className="absolute inset-0 bg-gradient-to-r from-black/58 via-black/20 to-transparent sm:from-black/52 sm:via-black/18" aria-hidden="true" />
      <div className={cn('absolute z-10 text-white', config.contentClassName)}>
        <p className="hero-reveal text-[11px] font-semibold uppercase leading-4 text-white/70 sm:text-xs" style={{ animationDelay: '0.02s' }}>
          {t(`${baseKey}.eyebrow`)}
        </p>
        <h2
          className="hero-reveal mt-2 text-[clamp(2rem,10vw,5.25rem)] font-semibold uppercase leading-[0.96] text-white sm:text-[clamp(3rem,6vw,5.25rem)]"
          style={{ animationDelay: `${config.animation?.titleDelay ?? 0.08}s` }}
        >
          {t(`${baseKey}.${config.titleKey}`)}
        </h2>
        <p
          className="hero-reveal mt-4 max-w-[34rem] text-base font-medium leading-6 text-white/82 sm:text-xl sm:leading-8 lg:text-2xl lg:leading-9"
          style={{ animationDelay: `${config.animation?.subtitleDelay ?? 0.22}s` }}
        >
          {t(`${baseKey}.${config.subtitleKey}`)}
        </p>
        {config.presentation === 'inline' ? (
          <InlineTags config={config} helperText={helperText} />
        ) : null}
      </div>

      {config.presentation === 'spatial' ? (
        <SpatialTags config={config} helperText={helperText} />
      ) : null}
    </div>
  )
}

function InlineTags({
  config,
  helperText,
}: {
  readonly config: HomeHeroOverlayConfig
  readonly helperText: string
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
        />
      ))}
    </ul>
  )
}

function SpatialTags({
  config,
  helperText,
}: {
  readonly config: HomeHeroOverlayConfig
  readonly helperText: string
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
  spatial = false,
}: {
  readonly className?: string
  readonly delay: number
  readonly label: string
  readonly spatial?: boolean
}) {
  return (
    <li
      className={cn(
        'hero-reveal inline-flex items-center gap-2 whitespace-nowrap text-[11px] font-medium leading-5 text-white/78 sm:text-xs',
        spatial && 'text-xs text-white/72 sm:text-sm',
        className,
      )}
      style={{ animationDelay: `${delay}s` }}
    >
      <span className="text-[#4DA3FF]" aria-hidden="true">
        ●
      </span>
      <span>{label}</span>
    </li>
  )
}
