import { buildDomainFromCmsFacts } from '../adapter/product.adapter.ts'
import { sensorValveCmsFactInput } from '../adapter/cms-fact-family.fixture.ts'
import { routing } from '../i18n/routing.ts'
import { buildAiReadableIndustrialProduct } from '../lib/geo/index.ts'

export function validateAiReadableFamilyProfileCoverage(errors) {
  const { products } = buildGeoFamilyCoverageDomain()
  const sensor = products.find((product) => Boolean(product.sensorProfile) && !product.valveProfile)
  const valve = products.find((product) => Boolean(product.valveProfile) && !product.sensorProfile)
  const summary = {
    requiredProfiles: ['sensor', 'valve'],
    fixtureProductRecords: products.length,
    sensorId: sensor?.identity.id ?? null,
    valveId: valve?.identity.id ?? null,
  }

  if (!sensor) {
    errors.push('geo profile coverage fixture missing sensor product')
  }

  if (!valve) {
    errors.push('geo profile coverage fixture missing valve product')
  }

  if (!sensor || !valve) {
    return summary
  }

  for (const locale of routing.locales) {
    validateAiReadableFamilyProduct(locale, sensor, 'sensor', errors)
    validateAiReadableFamilyProduct(locale, valve, 'valve', errors)
  }

  return summary
}

function validateAiReadableFamilyProduct(locale, product, expectedFamily, errors) {
  const readable = buildAiReadableIndustrialProduct(product, locale)

  if (readable.product.family !== expectedFamily) {
    errors.push(`${locale}:${product.identity.id}: expected family ${expectedFamily}, received ${readable.product.family}`)
  }

  if (!readable.sourceUrl || !readable.summary?.oneSentence || !readable.summary?.technicalAbstract || !readable.facts.length || !readable.faq.length) {
    errors.push(`${locale}:${product.identity.id}: ${expectedFamily} GEO output is not AI-readable`)
  }

  if ('lifecycle' in readable.product) {
    errors.push(`${locale}:${product.identity.id}: lifecycle must not appear in AI-readable product output`)
  }

  if (expectedFamily === 'sensor') {
    if (!readable.facts.some((fact) => fact.claimType === 'measurement-range')) {
      errors.push(`${locale}:${product.identity.id}: sensor GEO output is missing measurement-range facts`)
    }

    if (!readable.facts.some((fact) => fact.claimType === 'capability')) {
      errors.push(`${locale}:${product.identity.id}: sensor GEO output is missing capability facts`)
    }

    return
  }

  if (!readable.facts.some((fact) => fact.label === 'Pressure rating')) {
    errors.push(`${locale}:${product.identity.id}: valve GEO output is missing pressure rating facts`)
  }

  if (!readable.facts.some((fact) => fact.label === 'Connection')) {
    errors.push(`${locale}:${product.identity.id}: valve GEO output is missing connection facts`)
  }
}

function buildGeoFamilyCoverageDomain() {
  return buildDomainFromCmsFacts(sensorValveCmsFactInput)
}
