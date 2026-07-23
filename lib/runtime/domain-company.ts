import 'server-only'

import { getCmsCompanyPageContent } from '@/lib/cms/company-page'
import type { CompanyPageContent, CompanyPageMedia } from '@/lib/cms/company-page'
import type { LocaleCode } from '@/lib/domain'

export type { CompanyPageContent, CompanyPageMedia }

export async function getRuntimeCompanyPageContent(locale: LocaleCode): Promise<CompanyPageContent | null> {
  return getCmsCompanyPageContent(locale)
}
