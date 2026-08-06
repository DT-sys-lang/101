import Image from 'next/image'
import { Mail, MapPin, Phone } from 'lucide-react'
import { ContactInquiryForm } from './contact-inquiry-form'
import type { Locale } from '@/i18n/routing'
import type { StaticInfoPageViewModel } from '@/lib/domain'

export function ContactInquiryPage({ locale, data }: { locale: Locale; data: StaticInfoPageViewModel }) {
  const isChinese = locale === 'zh'
  return (
    <article className="bg-background">
      <section className="relative flex min-h-[400px] items-center border-b border-border bg-panel">
        <div className="absolute inset-0 opacity-30 grayscale" aria-hidden="true">
          <Image src="/images/hero/industrial-instrumentation.webp" alt="" fill preload sizes="100vw" className="object-cover" />
        </div>
        <div className="stitch-shell relative py-16">
          <h1 className="stitch-display max-w-3xl">{isChinese ? '联系工程团队' : 'Consult with Our Engineering Team'}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-600">{data.body}</p>
        </div>
      </section>

      <section className="stitch-shell py-16">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <aside className="flex flex-col gap-6 lg:col-span-4">
            <section className="border border-border bg-panel p-8">
              <h2 className="text-2xl font-medium text-ink-950">{isChinese ? '全球总部' : 'Global Headquarters'}</h2>
              <div className="mt-6 space-y-5">
                <ContactInfo icon={MapPin} label={isChinese ? '地址' : 'Address'} value={isChinese ? '中国上海市松江区明南路85号' : 'Building No. 85, Mingnan Street, Songjiang District, Shanghai, China'} />
                <ContactInfo icon={Phone} label={isChinese ? '电话' : 'Phone'} value="+86 21 61318500" />
                <ContactInfo icon={Mail} label={isChinese ? '邮箱' : 'Email'} value="sales@yufavor.com  bruce@yufavor.com" />
              </div>
              <div className="mt-8 aspect-video border border-border bg-ink-50 industrial-grid" />
              <div className="mt-8 border-t border-border pt-6">
                <h3 className="text-xs font-semibold uppercase text-ink-600">{isChinese ? '技术支持时间' : 'Technical Support Hours'}</h3>
                <p className="mt-3 text-sm leading-6 text-ink-950">Monday - Friday<br />08:00 - 18:00 (GMT+8)</p>
              </div>
            </section>
          </aside>

          <section className="lg:col-span-8">
            <div className="border border-border bg-panel p-8 md:p-12">
              <div className="mb-8 border-b border-border pb-6">
                <h2 className="text-3xl font-medium text-ink-950">{isChinese ? '询价 / 技术咨询' : 'Request for Quotation / Technical Inquiry'}</h2>
                <p className="mt-3 text-sm leading-6 text-ink-600">{isChinese ? '请提供尽可能完整的工况与参数，帮助工程团队将需求分配给合适的产品路径。' : 'Please provide detailed information to help our engineering team route your request to the appropriate specialist.'}</p>
              </div>
              <ContactInquiryForm locale={locale} />
            </div>
          </section>
        </div>
      </section>
    </article>
  )
}

function ContactInfo({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return <div className="flex items-start gap-3"><Icon className="mt-0.5 size-5 shrink-0 text-steel-700" aria-hidden="true" /><div><p className="text-xs font-semibold uppercase text-ink-600">{label}</p><p className="mt-1 text-sm leading-6 text-ink-950">{value}</p></div></div>
}
