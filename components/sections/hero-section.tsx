import type { Locale } from '@/i18n/routing'
import type { HomepageProjection } from '@/lib/domain'
import { HeroMediaCarousel } from './hero-media-carousel'

export function HeroSection({
  locale,
  hero,
}: {
  locale: Locale
  hero: HomepageProjection['hero']
}) {
  return <HeroMediaCarousel locale={locale} hero={hero} />
}
