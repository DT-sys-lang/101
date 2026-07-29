'use client'

import { useId, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CheckCircle2, Download } from 'lucide-react'
import type { Locale } from '@/i18n/routing'

export type ProductDetailDataRow = {
  readonly label: string
  readonly value: string
}

export type ProductDetailDownload = {
  readonly title: string
  readonly href: string
  readonly meta: string
}

export type ProductDetailImage = {
  readonly href: string
  readonly alt: string
}

type ProductDetailTabId = 'technical-specifications' | 'dimensions' | 'downloads'

export function ProductDetailDataTabs({
  locale,
  specRows,
  dimensionRows,
  features,
  downloads,
  primaryDownload,
  dimensionImage,
}: {
  readonly locale: Locale
  readonly specRows: readonly ProductDetailDataRow[]
  readonly dimensionRows: readonly ProductDetailDataRow[]
  readonly features: readonly string[]
  readonly downloads: readonly ProductDetailDownload[]
  readonly primaryDownload: ProductDetailDownload
  readonly dimensionImage: ProductDetailImage
}) {
  const zh = locale === 'zh'
  const tabBaseId = useId()
  const [activeTab, setActiveTab] = useState<ProductDetailTabId>('technical-specifications')
  const tabs: readonly { readonly id: ProductDetailTabId; readonly label: string }[] = [
    { id: 'technical-specifications', label: zh ? '技术规格' : 'Technical Specifications' },
    { id: 'dimensions', label: zh ? '尺寸' : 'Dimensions' },
    { id: 'downloads', label: zh ? '下载' : 'Downloads' },
  ]

  return (
    <section className="mb-16">
      <div role="tablist" aria-label={zh ? '产品详情数据' : 'Product detail data'} className="mb-8 flex gap-10 overflow-x-auto border-b border-[#E5E5E5]">
        {tabs.map((tab) => {
          const selected = tab.id === activeTab

          return (
            <button
              key={tab.id}
              id={`${tabBaseId}-${tab.id}-tab`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${tabBaseId}-${tab.id}-panel`}
              className={selected ? 'whitespace-nowrap border-b-2 border-[#005EB8] pb-4 text-base font-bold text-[#005EB8]' : 'whitespace-nowrap pb-4 text-base font-bold text-[#30383E] transition-colors hover:text-[#005EB8]'}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <div
        id={`${tabBaseId}-technical-specifications-panel`}
        role="tabpanel"
        aria-labelledby={`${tabBaseId}-technical-specifications-tab`}
        hidden={activeTab !== 'technical-specifications'}
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          <div className="overflow-x-auto border border-[#DDE1E4] bg-white md:col-span-8">
            <ProductDetailDataTable locale={locale} rows={specRows} />
          </div>
          <aside className="flex flex-col gap-5 border border-[#DDE1E4] bg-white p-8 md:col-span-4">
            <h2 className="text-2xl font-semibold text-[#1A1A1A]">{zh ? '关键特性' : 'Key Features'}</h2>
            <ul className="flex flex-col gap-3 text-base font-medium text-[#30383E]">
              {features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#005EB8]" aria-hidden="true" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>

      <div
        id={`${tabBaseId}-dimensions-panel`}
        role="tabpanel"
        aria-labelledby={`${tabBaseId}-dimensions-tab`}
        hidden={activeTab !== 'dimensions'}
      >
        <h2 className="mb-6 border-b border-[#E5E5E5] pb-4 text-3xl font-semibold text-[#1A1A1A]">{zh ? '尺寸与安装信息' : 'Dimensions & Installation Data'}</h2>
        <div className="grid gap-6 md:grid-cols-[0.95fr_1.05fr]">
          <div className="border border-[#DDE1E4] bg-white p-8">
            <ProductDetailDataTable locale={locale} rows={dimensionRows} />
          </div>
          <div className="flex min-h-[360px] items-center justify-center border border-[#DDE1E4] bg-[#F2F4F6] p-8">
            <Image src={dimensionImage.href} alt={dimensionImage.alt} width={680} height={420} className="max-h-[320px] w-full object-contain" />
          </div>
        </div>
      </div>

      <div
        id={`${tabBaseId}-downloads-panel`}
        role="tabpanel"
        aria-labelledby={`${tabBaseId}-downloads-tab`}
        hidden={activeTab !== 'downloads'}
      >
        <h2 className="mb-6 border-b border-[#E5E5E5] pb-4 text-3xl font-semibold text-[#1A1A1A]">{zh ? '下载' : 'Downloads'}</h2>
        <div className="grid max-w-3xl gap-4">
          {(downloads.length ? downloads : [primaryDownload]).map((download) => (
            <Link key={`${download.href}-${download.title}`} href={download.href} className="group flex items-center justify-between border border-[#DDE1E4] bg-white p-6 transition-all hover:border-[#005EB8] hover:shadow-lg">
              <span>
                <span className="block text-lg font-semibold text-[#1A1A1A] group-hover:text-[#005EB8]">{download.title}</span>
                <span className="mt-2 block text-sm font-medium text-[#4B555E]">{download.meta}</span>
              </span>
              <Download className="size-5 shrink-0 text-[#005EB8]" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function ProductDetailDataTable({
  locale,
  rows,
}: {
  readonly locale: Locale
  readonly rows: readonly ProductDetailDataRow[]
}) {
  const zh = locale === 'zh'

  return (
    <table className="w-full text-left text-base text-[#1A1A1A]">
      <thead>
        <tr>
          <th className="w-1/3 border-b border-[#DDE1E4] px-6 py-4 text-sm font-bold text-[#30383E]">{zh ? '参数' : 'Parameter'}</th>
          <th className="border-b border-[#DDE1E4] px-6 py-4 text-sm font-bold text-[#30383E]">{zh ? '数值 / 描述' : 'Value / Description'}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={`${row.label}-${index}`} className={index % 2 === 1 ? 'bg-[#F7F7F7]/70' : undefined}>
            <td className="border-b border-[#DDE1E4] px-6 py-5 text-lg font-medium text-[#1A1A1A]">{row.label}</td>
            <td className="border-b border-[#DDE1E4] px-6 py-5 text-lg font-medium text-[#1A1A1A]">{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
