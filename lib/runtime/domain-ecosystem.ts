import 'server-only'

import { listCmsIndustryEcosystemContent } from '@/lib/cms/ecosystem'
import type { EntryEcosystemContentInput, LocaleCode } from '@/lib/domain'

export async function listRuntimeIndustryEcosystemContent(
  locale: LocaleCode,
): Promise<readonly EntryEcosystemContentInput[]> {
  return listCmsIndustryEcosystemContent(locale)
}
