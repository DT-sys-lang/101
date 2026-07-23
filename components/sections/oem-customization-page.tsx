import Link from 'next/link'
import { ArrowRight, BadgeCheck, Boxes, Cable, ClipboardList, Factory, PackageCheck, PenTool, Workflow } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Locale } from '@/i18n/routing'
import type { StaticInfoPageViewModel } from '@/lib/domain'

const capabilityIcons = [Cable, Factory, BadgeCheck, Boxes]
const processIcons = [ClipboardList, PenTool, PackageCheck, Workflow]

export function OemCustomizationPage({ locale, data }: { locale: Locale; data: StaticInfoPageViewModel }) {
  const isChinese = locale === 'zh'
  const capabilities = data.quickLinks.length ? data.quickLinks : [{ label: 'Signal output', description: data.body, href: '/contact' }]
  const steps = isChinese
    ? ['需求确认', '工程设计', '样品验证', '批量交付']
    : ['Requirement', 'Design', 'Prototype', 'Production']

  return (
    <article className="bg-background">
      <section className="relative overflow-hidden border-b border-border bg-panel">
        <div className="absolute inset-0 industrial-grid opacity-70" aria-hidden="true" />
        <div className="stitch-shell relative grid min-h-[560px] items-center py-20">
          <div className="max-w-3xl">
            <p className="stitch-eyebrow">{data.eyebrow}</p>
            <h1 className="mt-4 stitch-display">{data.title}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-600">{data.body}</p>
            <Button asChild size="lg" className="mt-10"><Link href={`/${locale}/contact`}>{data.secondaryAction.label}<ArrowRight aria-hidden="true" /></Link></Button>
          </div>
        </div>
      </section>

      <section className="stitch-section bg-panel">
        <div className="stitch-shell">
          <h2 className="border-l-4 border-steel-700 pl-4 stitch-heading">{isChinese ? '工程能力' : 'Engineering Capability'}</h2>
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
            {capabilities.slice(0, 4).map((item, index) => {
              const Icon = capabilityIcons[index] ?? Boxes
              return (
                <section key={item.href} className="border border-border bg-panel p-8 transition-colors hover:border-steel-700">
                  <Icon className="size-8 text-steel-700" aria-hidden="true" />
                  <h3 className="mt-6 text-2xl font-medium text-ink-950">{item.label}</h3>
                  <p className="mt-4 text-sm leading-7 text-ink-600">{item.description}</p>
                </section>
              )
            })}
          </div>
        </div>
      </section>

      <section className="stitch-section bg-ink-50">
        <div className="stitch-shell">
          <h2 className="border-l-4 border-steel-700 pl-4 stitch-heading">{isChinese ? '开发流程' : 'Development Process'}</h2>
          <div className="relative mt-14 grid gap-6 md:grid-cols-4">
            {steps.map((step, index) => {
              const Icon = processIcons[index] ?? Workflow
              return (
                <section key={step} className="border border-border bg-panel p-6 text-center">
                  <span className="mx-auto grid h-10 w-10 place-items-center border border-border font-mono text-sm font-semibold text-steel-700">{String(index + 1).padStart(2, '0')}</span>
                  <Icon className="mx-auto mt-6 size-6 text-steel-700" aria-hidden="true" />
                  <h3 className="mt-5 text-xl font-medium text-ink-950">{step}</h3>
                  <p className="mt-4 text-sm leading-6 text-ink-600">{isChinese ? '以可确认的技术资料、样品和交付窗口推进下一步。' : 'Move forward through confirmed technical data, samples, and delivery windows.'}</p>
                </section>
              )
            })}
          </div>
        </div>
      </section>

      <section className="stitch-section bg-panel">
        <div className="stitch-shell grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="border-l-4 border-steel-700 pl-4 stitch-heading">{isChinese ? '测试与生产' : 'Testing & Production'}</h2>
            <ul className="mt-10 grid gap-6">
              {[isChinese ? '柔性制造产线' : 'Flexible manufacturing lines', isChinese ? '严格质量控制' : 'Rigorous quality control'].map((label) => (
                <li key={label} className="flex items-start gap-4">
                  <Factory className="mt-1 size-5 shrink-0 text-steel-700" aria-hidden="true" />
                  <div><h3 className="text-xl font-medium text-ink-950">{label}</h3><p className="mt-3 text-sm leading-7 text-ink-600">{isChinese ? '支持低批量定制与批量供货，同时保持参数、资料和交付节奏一致。' : 'Support low-volume specialized runs and repeat supply while keeping parameters, documents, and delivery rhythm aligned.'}</p></div>
                </li>
              ))}
            </ul>
          </div>
          <div className="aspect-[4/3] border border-border bg-ink-50 industrial-grid" />
        </div>
      </section>
    </article>
  )
}
