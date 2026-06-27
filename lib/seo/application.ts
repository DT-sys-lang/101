import type { EntryPageSeoData } from '@/lib/domain/entry-pages'
import type { Metadata } from 'next'
import { buildEntryPageJsonLd, buildEntryPageMetadata } from './entry-page'

export function buildApplicationPageMetadata(data: EntryPageSeoData): Metadata {
  return buildEntryPageMetadata(data)
}

export function buildApplicationPageJsonLd(data: EntryPageSeoData) {
  return buildEntryPageJsonLd(data)
}

export type ApplicationPageSeoData = EntryPageSeoData
