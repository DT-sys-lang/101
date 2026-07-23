import Link from 'next/link'
import { ArrowRight, FileCheck2, FileText, Landmark, Newspaper } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Locale } from '@/i18n/routing'
import type { StaticInfoPageViewModel } from '@/lib/domain'

const resourceIcons = [Newspaper, Landmark, FileText]

export function ResourceCenterPage({ locale, data }: { locale: Locale; data: StaticInfoPageViewModel }) {
  const isChinese = locale === 'zh'
  return (
    <article className="bg-background">
      <section className="border-b border-border bg-panel">
        <div className="stitch-shell py-16 lg:py-24">
          <div className="max-w-4xl">
            <p className="stitch-eyebrow">{data.eyebrow}</p>
            <h1 className="mt-4 stitch-display">{isChinese ? '技术资源' : 'Technical Resources'}</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-ink-600">{data.body}</p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg"><Link href={`/${locale}/resources/manuals`}>{isChinese ? '查看资料下载' : 'Open downloads'}<ArrowRight aria-hidden="true" /></Link></Button>
              <Button asChild size="lg" variant="secondary"><Link href={`/${locale}/contact`}>{data.secondaryAction.label}</Link></Button>
            </div>
          </div>
        </div>
      </section>

      <section className="stitch-section bg-panel">
        <div className="stitch-shell">
          <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 lg:flex-row lg:items-end">
            <div>
              <p className="stitch-eyebrow">{isChinese ? '精选资料' : 'Featured Catalogs'}</p>
              <h2 className="mt-4 stitch-heading">{isChinese ? '按任务进入资料库' : 'Enter resources by task'}</h2>
            </div>
            <Badge variant="outline">{isChinese ? '产品、案例与下载' : 'Products, cases, and downloads'}</Badge>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {data.quickLinks.map((item, index) => {
              const Icon = resourceIcons[index] ?? FileText
              return (
                <Link key={item.href} href={`/${locale}${item.href}`} className="group flex min-h-[292px] flex-col border border-border bg-panel p-6 transition-colors hover:border-steel-700">
                  <Icon className="size-8 text-steel-700" aria-hidden="true" />
                  <h3 className="mt-8 text-2xl font-medium text-ink-950 group-hover:text-steel-700">{item.label}</h3>
                  <p className="mt-4 text-sm leading-7 text-ink-600">{item.description}</p>
                  <span className="mt-auto inline-flex items-center gap-2 pt-8 text-sm font-semibold uppercase text-steel-700">{isChinese ? '进入资料' : 'Open resource'}<ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section className="stitch-section bg-ink-50">
        <div className="stitch-shell grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="stitch-eyebrow">{isChinese ? '资料状态' : 'Documentation status'}</p>
            <h2 className="mt-4 stitch-heading">{isChinese ? '用于采购归档与工程核对' : 'Built for procurement records and engineering checks'}</h2>
            <p className="mt-5 text-base leading-7 text-ink-600">{isChinese ? '资料页保持与产品型号、行业入口和询盘路径的对应关系，避免资料脱离产品上下文。' : 'Resource records remain aligned with product models, industry entries, and inquiry paths so documentation does not lose product context.'}</p>
          </div>
          <div className="grid gap-px border border-border bg-border sm:grid-cols-3">
            {[isChinese ? '数据手册' : 'Datasheet', isChinese ? '案例证据' : 'Case evidence', isChinese ? '技术说明' : 'Technical notes'].map((label, index) => <div key={label} className="bg-panel p-6"><FileCheck2 className="size-6 text-steel-700" aria-hidden="true" /><div className="mt-8 font-mono text-sm font-semibold text-ink-950">0{index + 1}</div><div className="mt-2 text-sm text-ink-600">{label}</div></div>)}
          </div>
        </div>
      </section>
    </article>
  )
}
