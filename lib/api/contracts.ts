import { NextResponse } from 'next/server'
import { routing, type Locale } from '@/i18n/routing'
import { getRuntimeDomainProductSource } from '@/lib/runtime/domain-products'

export const API_CONTRACT_VERSION = 'api-contract-v1'

export type ApiContractName =
  | 'cms-status'
  | 'revalidate'
  | 'cms-revalidate'
  | 'cms-preview'
  | 'product-feed'
  | 'geo-index'
  | 'geo-products'
  | 'geo-answers'
  | 'inquiry'

export interface ApiContractEnvelope<TData> {
  readonly contract: {
    readonly version: typeof API_CONTRACT_VERSION
    readonly name: ApiContractName
    readonly normalizedBy: 'adapter/domain'
    readonly boundary: 'api-route'
  }
  readonly source: ReturnType<typeof getRuntimeDomainProductSource>
  readonly data: TData
}

export interface ApiErrorEnvelope {
  readonly contract: {
    readonly version: typeof API_CONTRACT_VERSION
    readonly name: ApiContractName
    readonly normalizedBy: 'adapter/domain'
    readonly boundary: 'api-route'
  }
  readonly error: {
    readonly code: string
    readonly message: string
  }
}

export function jsonContract<TData>(name: ApiContractName, data: TData, init?: ResponseInit) {
  const envelope: ApiContractEnvelope<TData> = {
    contract: buildContract(name),
    source: getRuntimeDomainProductSource(),
    data,
  }

  return NextResponse.json(envelope, init)
}

export function jsonContractError(name: ApiContractName, code: string, message: string, status = 400) {
  const envelope: ApiErrorEnvelope = {
    contract: buildContract(name),
    error: {
      code,
      message,
    },
  }

  return NextResponse.json(envelope, { status })
}

export function getLocaleFromRequest(request: Request): Locale {
  const url = new URL(request.url)
  const locale = url.searchParams.get('locale')

  return isRuntimeLocale(locale) ? locale : routing.defaultLocale
}

export function isRuntimeLocale(value: string | null): value is Locale {
  return Boolean(value && routing.locales.includes(value as Locale))
}

function buildContract(name: ApiContractName) {
  return {
    version: API_CONTRACT_VERSION,
    name,
    normalizedBy: 'adapter/domain',
    boundary: 'api-route',
  } as const
}
