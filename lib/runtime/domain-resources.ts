import 'server-only'

import { listCmsResourceContent } from '@/lib/cms/resources'
import type { LocaleCode, ResourceCollectionKind, ResourceContentInput } from '@/lib/domain'

export async function listRuntimeResourceContent(
  locale: LocaleCode,
  kind: ResourceCollectionKind,
): Promise<readonly ResourceContentInput[]> {
  return listCmsResourceContent(locale, kind)
}
