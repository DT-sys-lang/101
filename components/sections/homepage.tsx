import type { Locale } from '@/i18n/routing'
import type { HomepageProjection } from '@/lib/domain'
import { ApplicationProofSection } from './application-proof-section'
import { ApplicationGatewaySection } from './application-gateway-section'
import { CategoryGatewaySection } from './category-gateway-section'
import { CtaSection } from './cta-section'
import { FeaturedProductsSection } from './featured-products-section'
import { HeroSection } from './hero-section'
import { IndustrialSection } from './industrial-section'
import { IndustryGatewaySection } from './industry-gateway-section'
import { ModuleSystemSection } from './module-system-section'
import { TrustSystemSection } from './trust-system-section'

export function HomePage({
  locale,
  data,
}: {
  locale: Locale
  data: HomepageProjection
}) {
  return (
    <>
      <HeroSection locale={locale} hero={data.hero} />
      <IndustrialSection tone="white">
        <TrustSystemSection data={data.trust} />
      </IndustrialSection>
      <IndustrialSection tone="white">
        <CategoryGatewaySection locale={locale} data={data.categories} />
      </IndustrialSection>
      <IndustrialSection tone="muted">
        <FeaturedProductsSection locale={locale} data={data.products} />
      </IndustrialSection>
      <IndustrialSection tone="white">
        <IndustryGatewaySection locale={locale} data={data.industries} />
      </IndustrialSection>
      <IndustrialSection tone="white">
        <ApplicationProofSection data={data.applicationProof} />
      </IndustrialSection>
      <IndustrialSection tone="muted">
        <ApplicationGatewaySection locale={locale} data={data.applications} />
      </IndustrialSection>
      <IndustrialSection tone="grid">
        <ModuleSystemSection data={data.modules} />
      </IndustrialSection>
      <IndustrialSection tone="muted">
        <CtaSection locale={locale} data={data.cta} />
      </IndustrialSection>
    </>
  )
}
