import type { EntryPageSeoData } from '@/lib/domain/entry-pages'
import type { Metadata } from 'next'
import { buildEntryPageJsonLd, buildEntryPageMetadata } from './entry-page'

export function buildIndustryPageMetadata(data: EntryPageSeoData): Metadata {
  return buildEntryPageMetadata(data)
}

export function buildIndustryPageJsonLd(data: EntryPageSeoData) {
  return buildEntryPageJsonLd(data)
}

export type IndustryPageSeoData = EntryPageSeoData
