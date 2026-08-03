'use client'

import { useState, type FormEvent } from 'react'
import { LoaderCircle, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Locale } from '@/i18n/routing'

type FormState = {
  name: string
  company: string
  email: string
  phone: string
  country: string
  quantity: string
  parameter: string
  message: string
  website: string
}

const initialState: FormState = {
  name: '',
  company: '',
  email: '',
  phone: '',
  country: '',
  quantity: '',
  parameter: 'Pressure',
  message: '',
  website: '',
}

export function ContactInquiryForm({ locale }: { locale: Locale }) {
  const [fields, setFields] = useState<FormState>(initialState)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const isChinese = locale === 'zh'

  const labels = isChinese
    ? { name: '联系人', company: '公司名称 *', email: '企业邮箱 *', phone: '电话', country: '国家 / 地区', quantity: '预计数量', parameter: '主要测量参数', message: '技术要求详情 *', submit: '提交询盘', success: '需求已提交，工程团队将跟进。', error: '提交失败，请稍后重试或联系销售邮箱。' }
    : { name: 'Contact name', company: 'Company name *', email: 'Corporate email *', phone: 'Phone', country: 'Country / region', quantity: 'Expected quantity', parameter: 'Primary measurement parameter', message: 'Technical requirements details *', submit: 'Submit inquiry', success: 'Request received. Engineering will follow up.', error: 'Unable to submit. Please retry or contact sales by email.' }
  const parameterOptions = [
    { value: 'Pressure', label: isChinese ? '压力' : 'Pressure' },
    { value: 'Temperature', label: isChinese ? '温度' : 'Temperature' },
    { value: 'Level', label: isChinese ? '液位' : 'Level' },
  ]

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('submitting')

    try {
      const response = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          intent: 'rfq',
          source: {
            locale,
            sourceType: 'contact-page',
            sourcePath: `/${locale}/contact`,
          },
          contact: {
            name: fields.name,
            email: fields.email,
            company: fields.company,
            country: fields.country,
            phone: fields.phone,
          },
          message: `[${fields.parameter}] ${fields.message}`,
          expectedQuantity: fields.quantity ? Number(fields.quantity) : undefined,
          website: fields.website,
        }),
      })

      if (!response.ok) throw new Error('Inquiry request failed')
      setStatus('success')
      setFields(initialState)
    } catch {
      setStatus('error')
    }
  }

  function updateField(name: keyof FormState, value: string) {
    setFields((current) => ({ ...current, [name]: value }))
    if (status !== 'idle') setStatus('idle')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <label className="absolute -left-[10000px] top-auto size-px overflow-hidden" aria-hidden="true">
        {isChinese ? '网站' : 'Website'}
        <input name="website" tabIndex={-1} autoComplete="off" value={fields.website} onChange={(event) => updateField('website', event.target.value)} />
      </label>
      <div className="grid gap-6 md:grid-cols-2">
        <FormField label={labels.name} value={fields.name} onChange={(value) => updateField('name', value)} />
        <FormField label={labels.company} value={fields.company} required onChange={(value) => updateField('company', value)} />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <FormField label={labels.country} value={fields.country} onChange={(value) => updateField('country', value)} />
        <FormField label={labels.email} value={fields.email} type="email" required onChange={(value) => updateField('email', value)} />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <FormField label={labels.phone} value={fields.phone} type="tel" onChange={(value) => updateField('phone', value)} />
        <FormField label={labels.quantity} value={fields.quantity} type="number" min="1" onChange={(value) => updateField('quantity', value)} />
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-ink-950">{labels.parameter}</legend>
        <div className="flex flex-wrap gap-4">
          {parameterOptions.map((item) => <label key={item.value} className="flex cursor-pointer items-center gap-2 text-sm text-ink-700"><input checked={fields.parameter === item.value} className="h-4 w-4 border-border text-steel-700 focus:ring-steel-700" name="parameter" type="radio" value={item.value} onChange={(event) => updateField('parameter', event.target.value)} /><span>{item.label}</span></label>)}
        </div>
      </fieldset>

      <label className="block space-y-2"><span className="text-sm font-semibold text-ink-950">{labels.message}</span><textarea value={fields.message} onChange={(event) => updateField('message', event.target.value)} required rows={5} className="input-industrial w-full resize-y" placeholder={isChinese ? '描述介质、压力范围、精度、环境因素和认证要求...' : 'Describe operating conditions, accuracy, environmental factors, and certifications needed...'} /></label>

      <div className="flex flex-col gap-4 border-t border-border pt-6 md:flex-row md:items-center md:justify-between">
        <span className={status === 'success' ? 'text-sm text-process-700' : status === 'error' ? 'text-sm text-red-700' : 'text-sm text-ink-500'} aria-live="polite">{status === 'success' ? labels.success : status === 'error' ? labels.error : null}</span>
        <Button type="submit" size="lg" disabled={status === 'submitting'}>{status === 'submitting' ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}{labels.submit}</Button>
      </div>
    </form>
  )
}

function FormField({ label, value, onChange, type = 'text', required = false, min }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; min?: string }) {
  return <label className="block space-y-2"><span className="text-sm font-semibold text-ink-950">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} type={type} required={required} min={min} className="input-industrial w-full" /></label>
}
